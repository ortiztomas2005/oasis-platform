import 'server-only';
import { supabaseAdmin } from '@/core/supabase/admin';
import crypto from 'crypto';
import { sendTicketConfirmationEmail } from '@/core/services/email';

/**
 * Único punto donde se completa una reventa: quema el ticket original
 * (FROZEN_RESALE -> RESOLD_BURNED) y emite uno nuevo a nombre del
 * comprador. Se llama SOLO server-to-server, desde el webhook de Mercado
 * Pago una vez que el pago está confirmado — nunca directo desde el
 * navegador, porque de ahí es de donde antes se regalaban entradas sin
 * cobrar (ver /api/resale/buy, ya eliminado).
 */
export async function completeResaleTransfer({
  resaleId,
  buyerName,
  buyerEmail,
  buyerDni,
}: {
  resaleId: string;
  buyerName: string;
  buyerEmail: string;
  buyerDni: string;
}) {
  const { data: resale, error: resaleErr } = await supabaseAdmin
    .from('ticket_resales')
    .select('*, tickets(*), events(*)')
    .eq('id', resaleId)
    .eq('status', 'AVAILABLE')
    .single();

  if (resaleErr || !resale) {
    throw new Error('La publicación de reventa ya no está disponible (puede que ya se haya vendido).');
  }

  const originalTicket = (resale as any).tickets;
  const event = (resale as any).events;

  // 1. Quemar el ticket original (la tabla "tickets" no tiene updated_at)
  if (originalTicket?.id) {
    await supabaseAdmin.from('tickets').update({ status: 'RESOLD_BURNED' }).eq('id', originalTicket.id);
  }

  // 2. Emitir un ticket nuevo para el comprador
  const newHash = 'OASIS-REV-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const tierName = originalTicket?.tier_name || resale.tier_name || 'GENERAL';

  const { data: newTicket, error: newTicketErr } = await supabaseAdmin
    .from('tickets')
    .insert([
      {
        event_id: resale.event_id,
        customer_name: buyerName,
        customer_email: buyerEmail,
        customer_dni: buyerDni,
        holder_name: buyerName,
        holder_email: buyerEmail,
        holder_dni: buyerDni,
        tier_name: tierName,
        auth_code: newHash,
        qr_hash: newHash,
        status: 'VALID',
        purchase_price: resale.resale_price,
      },
    ])
    .select()
    .single();

  if (newTicketErr) throw newTicketErr;

  // 3. Marcar la publicación como vendida (acá sí hay sold_at/buyer_*, no updated_at)
  await supabaseAdmin
    .from('ticket_resales')
    .update({
      status: 'SOLD',
      sold_at: new Date().toISOString(),
      buyer_email: buyerEmail,
      buyer_name: buyerName,
    })
    .eq('id', resaleId);

  // 4. Avisarle al comprador por email (no bloqueante)
  try {
    await sendTicketConfirmationEmail({
      toEmail: buyerEmail,
      customerName: buyerName,
      customerDni: buyerDni,
      eventName: event?.name || event?.title || 'Evento Oficial Live Experience',
      eventDate: event?.date,
      eventVenue: event?.venue,
      tierName,
      authCode: newHash,
    });
  } catch (mailErr) {
    console.error('Error enviando email de confirmación de reventa:', mailErr);
  }

  return { ticket: newTicket, authCode: newHash };
}
