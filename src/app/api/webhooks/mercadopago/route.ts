import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get('type') || url.searchParams.get('topic');
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Procesamos sólo notificaciones de tipo pago
    if (topic !== 'payment' && !paymentId) {
      return NextResponse.json({ received: true });
    }

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // 1. Consultamos el pago verificado directamente en la API de Mercado Pago
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status === 'approved') {
      const orderId = paymentData.external_reference;

      if (!orderId) {
        return NextResponse.json({ received: true });
      }

      // 2. Buscamos la orden en Supabase
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order || order.status === 'COMPLETED') {
        return NextResponse.json({ received: true });
      }

      // 3. Marcamos la orden como COMPLETED
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // 4. Buscamos los tipos de ticket del evento para emitir
      const { data: ticketTypes } = await supabaseAdmin
        .from('ticket_types')
        .select('*')
        .eq('event_id', order.event_id);

      if (ticketTypes && ticketTypes.length > 0) {
        const defaultTicketType = ticketTypes[0];

        // Generamos un ticket emitido con token de seguridad criptográfico
        const securitySecret = crypto.randomBytes(16).toString('hex');

        await supabaseAdmin.from('issued_tickets').insert({
          organization_id: order.organization_id,
          event_id: order.event_id,
          order_id: order.id,
          ticket_type_id: defaultTicketType.id,
          status: 'ISSUED',
          secret_token: securitySecret,
        });

        // Descontamos del stock disponible
        await supabaseAdmin
          .from('ticket_types')
          .update({
            available_quota: Math.max(0, defaultTicketType.available_quota - 1),
          })
          .eq('id', defaultTicketType.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Mercado Pago error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}