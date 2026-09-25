import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { checkRateLimit, getClientIp } from '@/core/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`checkout:${ip}`, { limit: 15, windowSeconds: 300 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos de compra. Esperá unos minutos.' }, { status: 429 });
    }

    const {
      eventId,
      ticketTier,
      customerName,
      customerEmail,
      customerDni,
      userId,
      receiptUrl,
    } = await req.json();

    if (!eventId || !ticketTier || !customerName || !customerEmail || !customerDni) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Mismo motivo que en /api/checkout/mercadopago: el precio se resuelve
    // acá contra la tanda real, nunca se confía en lo que mande el cliente.
    const { data: tier } = await supabaseAdmin
      .from('ticket_tiers')
      .select('price, available_capacity')
      .eq('event_id', eventId)
      .eq('name', ticketTier)
      .maybeSingle();

    if (!tier) {
      return NextResponse.json({ error: 'La tanda seleccionada no existe para este evento.' }, { status: 400 });
    }
    if (tier.available_capacity !== undefined && tier.available_capacity !== null && tier.available_capacity <= 0) {
      return NextResponse.json({ error: 'Esa tanda ya está agotada.' }, { status: 400 });
    }
    const amount = Number(tier.price);

    // Generar código de referencia único para el comprobante (ej: OASIS-TR-9482)
    const referenceCode = `TR-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          event_id: eventId,
          user_id: userId || null,
          ticket_tier: ticketTier,
          amount,
          payment_method: 'TRANSFER_MANUAL',
          status: 'PENDING',
          customer_name: customerName,
          customer_email: customerEmail.toLowerCase().trim(),
          customer_dni: customerDni.trim(),
          receipt_url: receiptUrl || null,
          reference_code: referenceCode,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      order,
      referenceCode,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
