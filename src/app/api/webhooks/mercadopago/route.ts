import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/core/supabase/admin';
import { payment as mpPayment } from '@/core/mercadopago';
import { completeResaleTransfer } from '@/core/services/resale';
import { issuePrimaryTicketForOrder } from '@/core/services/orders';

export const dynamic = 'force-dynamic';

// Valida el header x-signature que manda Mercado Pago, según su formato
// documentado: "ts=<timestamp>,v1=<hmac-sha256 hex>" sobre el manifest
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;". Es una capa extra:
// aunque esto fallara, más abajo igual se le vuelve a preguntar a la API
// de MP el estado real del pago antes de emitir nada, así que un webhook
// falsificado nunca alcanza para emitir un ticket por sí solo.
function isValidMpSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin secreto configurado, no se puede validar — se confía en el re-chequeo contra la API

  const signatureHeader = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  if (!signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Antes este handler solo hacía console.log del ID de pago y no emitía
// nada: ni las compras primarias (/api/checkout/mercadopago) ni las
// reventas (/api/resale/checkout) se confirmaban solas, quedaban PENDING
// para siempre salvo que un admin las aprobara a mano.
//
// Ahora, al recibir la notificación, se valida la firma (si hay
// MP_WEBHOOK_SECRET configurado) y ADEMÁS se le vuelve a preguntar a la
// API de Mercado Pago el estado real del pago — nunca se confía en el
// body del webhook solo — y recién ahí se emite el ticket correspondiente.
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (!paymentId || (topic && topic !== 'payment')) {
      return NextResponse.json({ received: true });
    }

    if (!isValidMpSignature(req, paymentId)) {
      console.error('Webhook de Mercado Pago con firma inválida, se descarta.');
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      console.warn('Webhook de Mercado Pago recibido pero MP_ACCESS_TOKEN no está configurado; se ignora.');
      return NextResponse.json({ received: true });
    }

    // NOTA sin probar en vivo todavía: esto consulta el pago con el token
    // de la aplicación de OASIS (platform-level), no con el de la
    // productora que conectó su cuenta y cobró. Las apps de Mercado Pago
    // dadas de alta como marketplace deberían poder leer pagos hechos con
    // tokens obtenidos vía su propio flujo OAuth — pero esto recién se
    // puede confirmar con una productora conectada de verdad haciendo una
    // venta real. Si en la práctica devuelve 403/404, hay que resolver acá
    // primero con qué productora está asociada la orden (por reference_code
    // en el query, si MP lo llega a mandar) y usar getValidProducerAccessToken
    // de esa productora en vez del token de plataforma.
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
