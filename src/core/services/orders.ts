import { supabaseAdmin } from '@/core/supabase/admin';
import { sendTicketConfirmationEmail } from '@/core/services/email';
import crypto from 'crypto';

/**
 * Emite el ticket de una orden de compra primaria (PENDING -> APPROVED) y
 * manda el mail de confirmación. La usan tanto la aprobación manual de un
 * admin (/api/admin/orders) como la confirmación automática del webhook de
 * Mercado Pago, para no tener la misma lógica de emisión duplicada en dos
 * lugares que se puedan ir desalineando.
 */
export async function issuePrimaryTicketForOrder(order: any): Promise<string> {
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
      eventName: order.events?.name || 'Evento Oficial OASIS',
      eventDate: order.events?.date,
      eventVenue: order.events?.venue,
      tierName: order.ticket_tier,
      authCode: uniqueHash,
    });
  } catch (mailErr) {
    console.error('Error enviando email de confirmación de orden:', mailErr);
  }

  return uniqueHash;
}
