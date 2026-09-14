import { supabaseAdmin } from '@/core/supabase/admin';
import { sendTicketConfirmationEmail } from '@/core/services/email';
import { consumeProducerTicket, refundProducerTicket } from '@/core/services/producers';
import crypto from 'crypto';

/**
 * Emite el ticket de una orden de compra primaria (PENDING -> APPROVED) y
 * manda el mail de confirmación. La usan tanto la aprobación manual de la
 * productora/admin (/api/producers/orders, /api/admin/orders) como la
 * confirmación automática de los webhooks de Mercado Pago y AstroPay, para
 * no tener la misma lógica de emisión duplicada en varios lugares que se
 * puedan ir desalineando.
 *
 * Si el evento tiene una productora asignada, primero descuenta 1 ticket
 * de su saldo prepago — si no le queda saldo, no se emite nada.
 */
export async function issuePrimaryTicketForOrder(order: any): Promise<string> {
  const producerName: string | null = order.events?.producer_name || null;

  if (producerName) {
    const consumed = await consumeProducerTicket(producerName);
    if (!consumed) {
      throw new Error(
        `La productora "${producerName}" no tiene tickets disponibles para vender. Recargá tu saldo prepago para poder confirmar esta venta.`
      );
    }
  }

  try {
    const rawSeed = `${order.event_id}-${order.customer_dni}-${Date.now()}-${Math.random()}`;
    const uniqueHash = crypto.createHash('sha256').update(rawSeed).digest('hex').substring(0, 32);

    const { error: ticketErr } = await supabaseAdmin.from('tickets').insert([
      {
        event_id: order.event_id,
        user_id: order.user_id,
        qr_hash: uniqueHash,
        auth_code: uniqueHash,
        tier_name: order.ticket_tier,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_dni: order.customer_dni,
        holder_name: order.customer_name,
        holder_email: order.customer_email,
        holder_dni: order.customer_dni,
        status: 'AVAILABLE',
      },
    ]);

    if (ticketErr) throw ticketErr;

    await supabaseAdmin
      .from('orders')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    try {
      await sendTicketConfirmationEmail({
        toEmail: order.customer_email,
        customerName: order.customer_name,
        customerDni: order.customer_dni,
        eventName: order.events?.name || 'Evento Oficial Live Experience',
        eventDate: order.events?.date,
        eventVenue: order.events?.venue,
        tierName: order.ticket_tier,
        authCode: uniqueHash,
      });
    } catch (mailErr) {
      console.error('Error enviando email de confirmación de orden:', mailErr);
    }

    return uniqueHash;
  } catch (err) {
    // Si se llegó a descontar el ticket del saldo pero la emisión falló
    // después, se lo devolvemos — no le queda debiendo un ticket a la
    // productora por un error nuestro.
    if (producerName) await refundProducerTicket(producerName);
    throw err;
  }
}
