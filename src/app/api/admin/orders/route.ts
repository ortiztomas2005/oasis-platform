import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { sendTicketConfirmationEmail } from '@/core/services/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, events(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: orders || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { orderId, action } = await req.json();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, events(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // 1. Generar hash criptográfico único
      const rawSeed = `${order.event_id}-${order.customer_dni}-${Date.now()}-${Math.random()}`;
      const uniqueHash = crypto.createHash('sha256').update(rawSeed).digest('hex').substring(0, 32);

      // 2. Insertar completando todas las variantes posibles de columnas
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

      // 3. Marcar la orden como aprobada
      await supabaseAdmin
        .from('orders')
        .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      // 4. Disparar el correo con el QR
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

      return NextResponse.json({ success: true, message: 'Entrada emitida y enviada por email' });
    } else {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      return NextResponse.json({ success: true, message: 'Orden rechazada' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}