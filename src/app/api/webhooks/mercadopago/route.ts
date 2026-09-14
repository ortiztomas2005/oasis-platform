import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { payment as mpPayment } from '@/core/mercadopago';
import { completeResaleTransfer } from '@/core/services/resale';
import { issuePrimaryTicketForOrder } from '@/core/services/orders';

export const dynamic = 'force-dynamic';

// Antes este handler solo hacía console.log del ID de pago y no emitía
// nada: ni las compras primarias (/api/checkout/mercadopago) ni las
// reventas (/api/resale/checkout) se confirmaban solas, quedaban PENDING
// para siempre salvo que un admin las aprobara a mano.
//
// Ahora, al recibir la notificación, le volvemos a preguntar a la API de
// Mercado Pago el estado real del pago (nunca confiamos en el body del
// webhook: cualquiera puede pegarle a esta URL con un status "approved"
// inventado) y recién ahí emitimos el ticket correspondiente.
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (!paymentId || (topic && topic !== 'payment')) {
      return NextResponse.json({ received: true });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      console.warn('Webhook de Mercado Pago recibido pero MP_ACCESS_TOKEN no está configurado; se ignora.');
      return NextResponse.json({ received: true });
    }

    const paymentData = await mpPayment.get({ id: paymentId });

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ received: true });
    }

    const metadata = (paymentData.metadata || {}) as Record<string, any>;

    // Caso 1: compra de una entrada revendida (ver /api/resale/checkout)
    if (metadata.type === 'RESALE_PURCHASE' && metadata.resale_id) {
      await completeResaleTransfer({
        resaleId: metadata.resale_id,
        buyerName: metadata.buyer_name || 'Comprador OASIS',
        buyerEmail: metadata.buyer_email || '',
        buyerDni: metadata.buyer_dni || '',
      });
      return NextResponse.json({ received: true });
    }

    // Caso 2: compra primaria (ver /api/checkout/mercadopago)
    if (metadata.order_reference) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*, events(*)')
        .eq('reference_code', metadata.order_reference)
        .single();

      if (order && order.status === 'PENDING') {
        await issuePrimaryTicketForOrder(order);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    // Devolvemos 200 igual para que Mercado Pago no reintente en loop; el
    // error queda logueado server-side para revisar a mano.
    console.error('Error procesando webhook de Mercado Pago:', err);
    return NextResponse.json({ received: true, error: err.message });
  }
}
