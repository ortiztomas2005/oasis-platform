import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { timingSafeEqual } from 'crypto';
import { issuePrimaryTicketForOrder } from '@/core/services/orders';

export const dynamic = 'force-dynamic';

function isValidWebhookSecret(req: Request): boolean {
  const expected = process.env.ASTROPAY_WEBHOOK_SECRET;
  // Sin una AstroPay real conectada (no hay ASTROPAY_* configurado en ningún
  // lado del proyecto) este webhook no tiene nada legítimo que procesar
  // todavía, así que por defecto queda cerrado.
  if (!expected) return false;

  const provided = req.headers.get('x-webhook-secret') || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    // Antes esto no verificaba nada: cualquiera podía mandar
    // {merchant_deposit_id, status: "APPROVED"} con un código de 6 dígitos
    // adivinado y aprobar una orden PENDING gratis (ver el fix análogo en el
    // webhook de Mercado Pago, que en vez de un secreto compartido vuelve a
    // preguntarle a la API de MP). Hasta que haya credenciales reales de
    // AstroPay y se confirme cómo firma sus webhooks, esto exige un secreto
    // compartido por header (ASTROPAY_WEBHOOK_SECRET) y sin él no procesa nada.
    if (!isValidWebhookSecret(req)) {
      return NextResponse.json({ error: 'Firma de webhook inválida o no configurada' }, { status: 401 });
    }

    const payload = await req.json();
    const { merchant_deposit_id, status } = payload;

    // Verificar si el pago fue aprobado
    if (status === 'APPROVED' || status === 'COMPLETED' || payload.event === 'deposit.completed') {
      const referenceCode = merchant_deposit_id || payload.data?.merchant_deposit_id;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*, events(*)')
        .eq('reference_code', referenceCode)
        .eq('payment_method', 'ASTROPAY')
        .single();

      if (order && order.status === 'PENDING') {
        await issuePrimaryTicketForOrder(order);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
