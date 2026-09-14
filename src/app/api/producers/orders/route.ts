import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { issuePrimaryTicketForOrder } from '@/core/services/orders';
import { canManageEvent, getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Lista las órdenes de LOS EVENTOS DE MI PRODUCTORA (no todas como
// /api/admin/orders, que es la vista de soporte de OASIS). Así una
// productora puede confirmar sus propias transferencias sin depender de
// que alguien de OASIS lo haga a mano.
export async function GET() {
  const producerName = await getManagedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, events!inner(name, title, producer_name)')
    .eq('events.producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: orders || [], producerName });
}

export async function POST(req: Request) {
  try {
    const { orderId, action } = await req.json();
    if (!orderId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, events(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Solo el staff (OWNER/ADMIN) de la productora dueña del evento de esta
    // orden puede confirmarla o rechazarla (o un admin de OASIS).
    const access = await canManageEvent(order.event_id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: `Esta orden ya está en estado ${order.status}.` }, { status: 400 });
    }

    if (action === 'APPROVE') {
      await issuePrimaryTicketForOrder(order);
      return NextResponse.json({ success: true, message: 'Pago confirmado: entrada emitida y enviada por email.' });
    }

    await supabaseAdmin
      .from('orders')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    return NextResponse.json({ success: true, message: 'Orden rechazada.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
