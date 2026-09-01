import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { eventId, ticketTier, amount, customerName, customerEmail, customerDni, userId } = await req.json();

    if (!eventId || !ticketTier || !amount || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const referenceCode = `AP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Guardar orden pendiente
    await supabaseAdmin.from('orders').insert([
      {
        event_id: eventId,
        user_id: userId || null,
        ticket_tier: ticketTier,
        amount,
        payment_method: 'ASTROPAY',
        status: 'PENDING',
        customer_name: customerName,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_dni: customerDni.trim(),
        reference_code: referenceCode,
      },
    ]);

    // Modo simulación / Sandbox si no hay API Key de AstroPay configurada
    return NextResponse.json({
      success: true,
      simulation: true,
      referenceCode,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
