import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { mpPayment } from '@/core/mercadopago/client';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || searchParams.get('topic');
    const paymentId = searchParams.get('data.id') || searchParams.get('id');

    if (type !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 1. Consultar el estado real del pago a la API de Mercado Pago
    const payment = await mpPayment.get({ id: paymentId });

    if (!payment || payment.status !== 'approved') {
      return NextResponse.json({ status: payment?.status || 'unapproved' }, { status: 200 });
    }

    const externalRef = payment.external_reference; // Contiene el order_id
    if (!externalRef) {
      return NextResponse.json({ error: 'Falta external_reference' }, { status: 400 });
    }

    // 2. Verificar que la orden exista y esté PENDING
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', externalRef)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.status === 'PAID') {
      // Idempotencia: ya procesada previamente
      return NextResponse.json({ success: true, message: 'Orden ya procesada' }, { status: 200 });
    }

    // 3. Actualizar orden a PAID
    await supabaseAdmin
      .from('orders')
      .update({ status: 'PAID' })
      .eq('id', order.id);

    // 4. Emitir los tickets correspondientes a cada ítem de la orden
    const items = order.order_items || [];
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const uniqueHash = crypto.randomBytes(4).toString('hex').toUpperCase();
        const ticketCode = `OASIS-${uniqueHash}`;
        const qrHash = crypto
          .createHash('sha256')
          .update(ticketCode + (process.env.NEXT_PUBLIC_SUPABASE_URL || 'oasis-secret'))
          .digest('hex');

        // Extraer datos del comprador guardados en metadata
        const metadata = (payment.metadata as any) || {};

        await supabaseAdmin.from('issued_tickets').insert({
          organization_id: order.organization_id,
          event_id: order.event_id,
          ticket_type_id: item.ticket_type_id,
          order_id: order.id,
          order_item_id: item.id,
          ticket_code: ticketCode,
          qr_hash: qrHash,
          attendee_first_name: metadata.first_name || 'Titular',
          attendee_last_name: metadata.last_name || 'Comprador',
          attendee_dni: metadata.dni || '00000000',
          status: 'ISSUED',
          is_courtesy: false,
        });

        // Descontar cupo
        const { data: tier } = await supabaseAdmin
          .from('ticket_types')
          .select('available_quota')
          .eq('id', item.ticket_type_id)
          .single();

        if (tier) {
          await supabaseAdmin
            .from('ticket_types')
            .update({ available_quota: Math.max(0, tier.available_quota - 1) })
            .eq('id', item.ticket_type_id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}