import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { issuePrimaryTicketForOrder } from '@/core/services/orders';
import { requireAdminSession } from '@/core/auth/admin-session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

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
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

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
      await issuePrimaryTicketForOrder(order);
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
