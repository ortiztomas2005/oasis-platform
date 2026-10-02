import 'server-only';
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

  // Descuenta 1 lugar de la tanda vendida (antes esto no pasaba nunca, así
  // que el "stock" de una tanda era ficticio y nunca se agotaba solo por
  // vender). Se busca por nombre porque las órdenes guardan el nombre de
  // la tanda, no su id. Si no se encuentra o ya está en 0, no bloquea la
  // venta (para no romper eventos con tandas cargadas de otra forma) pero
  // sí revierte el saldo prepago si ya se había descontado.
  let tierId: string | null = null;
  if (order.event_id && order.ticket_tier) {
    const { data: tierRow } = await supabaseAdmin
      .from('ticket_tiers')
      .select('id')
      .eq('event_id', order.event_id)
      .eq('name', order.ticket_tier)
      .maybeSingle();
    tierId = tierRow?.id || null;

    if (tierId) {
      const { data: decremented, error: decErr } = await supabaseAdmin.rpc('decrement_tier_capacity', {
        p_tier_id: tierId,
      });
      if (decErr) console.error('Error al descontar stock de la tanda:', decErr);
      if (!decErr && !decremented) {
        if (producerName) await refundProducerTicket(producerName);
        throw new Error(`La tanda "${order.ticket_tier}" ya está agotada.`);
      }
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
      let branding: {
        contact_email?: string | null;
        email_logo_url?: string | null;
        email_brand_color?: string | null;
        email_footer_text?: string | null;
        email_extra_info?: string | null;
      } | null = null;

      if (producerName) {
        const { data: producerRow } = await supabaseAdmin
          .from('producers')
          .select('contact_email, email_logo_url, email_brand_color, email_footer_text, email_extra_info')
          .eq('name', producerName)
          .maybeSingle();
        branding = producerRow;
      }

      await sendTicketConfirmationEmail({
        toEmail: order.customer_email,
        customerName: order.customer_name,
        customerDni: order.customer_dni,
        eventName: order.events?.name || 'Evento Oficial Live Experience',
        eventDate: order.events?.date,
        eventVenue: order.events?.venue,
        tierName: order.ticket_tier,
        authCode: uniqueHash,
        producerDisplayName: producerName,
        replyToEmail: branding?.contact_email,
        logoUrl: branding?.email_logo_url,
        brandColor: branding?.email_brand_color,
        footerText: branding?.email_footer_text,
        extraInfo: branding?.email_extra_info,
      });
    } catch (mailErr) {
      console.error('Error enviando email de confirmación de orden:', mailErr);
    }

    return uniqueHash;
  } catch (err) {
    // Si se llegó a descontar el ticket del saldo (o el lugar de la tanda)
    // pero la emisión falló después, se devuelven ambos — no le queda
    // debiendo nada a la productora por un error nuestro.
    if (producerName) await refundProducerTicket(producerName);
    if (tierId) await supabaseAdmin.rpc('increment_tier_capacity', { p_tier_id: tierId });
    throw err;
  }
}
