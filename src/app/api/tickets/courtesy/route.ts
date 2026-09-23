import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { randomBytes, createHash } from 'crypto';
import { canManageEvent, consumeProducerTicket, refundProducerTicket } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { event_id, holder_name, holder_email, holder_dni, tier_name } = await req.json();

    if (!event_id || !holder_name || !holder_email || !holder_dni) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Antes esta ruta no chequeaba quién la llamaba: cualquiera podía
    // mandarle un event_id y llevarse una entrada "VIP" gratis. Ahora hace
    // falta ser staff (OWNER/ADMIN) de la productora dueña del evento, o
    // admin de Live Experience.
    const access = await canManageEvent(event_id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Una cortesía también consume 1 ticket del saldo prepago de la
    // productora, igual que una venta — si no le queda saldo, no se emite.
    if (access.producerName) {
      const consumed = await consumeProducerTicket(access.producerName);
      if (!consumed) {
        return NextResponse.json(
          {
            error: `La productora "${access.producerName}" no tiene tickets disponibles. Recargá tu saldo prepago para poder enviar cortesías.`,
          },
          { status: 400 }
        );
      }
    }

    // Y también descuenta 1 lugar real de la tanda (si existe con ese
    // nombre), igual que una venta paga — una cortesía ocupa un asiento
    // real, no es gratis en términos de stock.
    let tierId: string | null = null;
    const { data: tierRow } = await supabaseAdmin
      .from('ticket_tiers')
      .select('id')
      .eq('event_id', event_id)
      .eq('name', tier_name || 'VIP INVITADO')
      .maybeSingle();
    tierId = tierRow?.id || null;

    if (tierId) {
      const { data: decremented, error: decErr } = await supabaseAdmin.rpc('decrement_tier_capacity', {
        p_tier_id: tierId,
      });
      if (!decErr && !decremented) {
        if (access.producerName) await refundProducerTicket(access.producerName);
        return NextResponse.json({ error: `La tanda "${tier_name}" ya está agotada.` }, { status: 400 });
      }
    }

    // Generar hash criptográfico único para el QR
    const entropy = randomBytes(16).toString('hex');
    const qr_hash = createHash('sha256')
      .update(`${event_id}-${holder_dni}-${Date.now()}-${entropy}`)
      .digest('hex');

    // Insertar en Supabase
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        event_id,
        holder_name,
        holder_email,
        holder_dni,
        tier_name: tier_name || 'VIP INVITADO',
        purchase_price: 0,
        qr_hash,
        status: 'VALID',
      })
      .select()
      .single();

    if (error) {
      if (access.producerName) await refundProducerTicket(access.producerName);
      if (tierId) await supabaseAdmin.rpc('increment_tier_capacity', { p_tier_id: tierId });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
