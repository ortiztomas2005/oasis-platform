import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const {
      eventId,
      ticketTier,
      amount,
      customerName,
      customerEmail,
      customerDni,
      userId,
      receiptUrl,
    } = await req.json();

    if (!eventId || !ticketTier || !amount || !customerName || !customerEmail || !customerDni) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

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
