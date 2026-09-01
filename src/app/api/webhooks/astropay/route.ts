import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { merchant_deposit_id, status } = payload;

    // Verificar si el pago fue aprobado
    if (status === 'APPROVED' || status === 'COMPLETED' || payload.event === 'deposit.completed') {
      const referenceCode = merchant_deposit_id || payload.data?.merchant_deposit_id;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('reference_code', referenceCode)
        .single();

      if (order && order.status === 'PENDING') {
        // Generar hash SHA-256 único
        const rawSeed = `${order.event_id}-${order.customer_dni}-${Date.now()}`;
        const authCode = crypto.createHash('sha256').update(rawSeed).digest('hex').substring(0, 32);

        // Emitir Ticket oficial
        await supabaseAdmin.from('tickets').insert([
          {
            event_id: order.event_id,
            user_id: order.user_id,
            auth_code: authCode,
            tier_name: order.ticket_tier,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_dni: order.customer_dni,
            status: 'AVAILABLE',
          },
        ]);

        // Actualizar Orden
        await supabaseAdmin
          .from('orders')
          .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
          .eq('id', order.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
