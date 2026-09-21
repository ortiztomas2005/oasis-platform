import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Dashboard, reportes y actividad reciente de MI PRODUCTORA, calculados en
// vivo a partir de eventos/tickets/órdenes/gastos reales. Reemplaza las tres
// secciones locales "Dashboard & Métricas", "Reportes & Auditoría" y
// "Actividad en Vivo" de /admin (que eran demo, sin datos reales).
export async function GET() {
  const producerName = await getManagedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: events, error: eventsErr } = await supabaseAdmin
    .from('events')
    .select('id, name, title, status, date')
    .eq('producer_name', producerName);
  if (eventsErr) return NextResponse.json({ error: eventsErr.message }, { status: 500 });

  const eventIds = (events || []).map((e) => e.id);

  let tickets: any[] = [];
  let orders: any[] = [];
  let costs: any[] = [];

  if (eventIds.length > 0) {
    const [ticketsRes, ordersRes, costsRes] = await Promise.all([
      supabaseAdmin
        .from('tickets')
        .select('id, event_id, tier_name, holder_name, purchase_price, status, created_at, scanned_at')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('orders')
        .select('id, event_id, ticket_tier, amount, status, customer_name, created_at')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('event_costs')
        .select('id, event_id, category, concept, amount, is_paid')
        .in('event_id', eventIds),
    ]);
    tickets = ticketsRes.data || [];
    orders = ordersRes.data || [];
    costs = costsRes.data || [];
  }

  const eventNameById = new Map((events || []).map((e) => [e.id, e.name || e.title]));

  const totalTicketsSold = tickets.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (Number(t.purchase_price) || 0), 0);
  const totalScanned = tickets.filter((t) => t.status === 'USED' || t.scanned_at).length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const totalCosts = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const unpaidCosts = costs.filter((c) => !c.is_paid).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const soldByEvent: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const t of tickets) {
    const key = t.event_id;
    if (!soldByEvent[key]) soldByEvent[key] = { name: eventNameById.get(key) || 'Evento', count: 0, revenue: 0 };
    soldByEvent[key].count += 1;
    soldByEvent[key].revenue += Number(t.purchase_price) || 0;
  }

  const recentActivity = [
    ...tickets.slice(0, 10).map((t) => ({
      type: t.scanned_at ? 'scan' : 'ticket',
      label: t.scanned_at
        ? `Escaneo en puerta: ${t.holder_name} (${eventNameById.get(t.event_id) || 'evento'})`
        : `Nuevo ticket: ${t.holder_name} · ${t.tier_name} (${eventNameById.get(t.event_id) || 'evento'})`,
      at: t.scanned_at || t.created_at,
    })),
    ...orders.slice(0, 10).map((o) => ({
      type: 'order',
      label: `Orden ${o.status === 'PENDING' ? 'pendiente' : o.status.toLowerCase()}: ${o.customer_name} · $${Number(o.amount).toLocaleString('es-AR')} (${eventNameById.get(o.event_id) || 'evento'})`,
      at: o.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 15);

  return NextResponse.json({
    producerName,
    totals: {
      events: (events || []).length,
      ticketsSold: totalTicketsSold,
      ticketsScanned: totalScanned,
      revenue: totalRevenue,
      pendingOrders,
      totalCosts,
      unpaidCosts,
      netProfit: totalRevenue - totalCosts,
    },
    soldByEvent: Object.values(soldByEvent),
    recentActivity,
  });
}
