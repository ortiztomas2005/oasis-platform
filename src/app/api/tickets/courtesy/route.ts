import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { randomBytes, createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { event_id, holder_name, holder_email, holder_dni, tier_name } = await req.json();

    if (!event_id || !holder_name || !holder_email || !holder_dni) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
