import Link from 'next/link';
import { supabaseAdmin } from '@/core/supabase/admin';
import { CostManager } from '@/components/CostManager';

export const revalidate = 0;

interface AdminDashboardProps {
  searchParams: Promise<{ event_id?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardProps) {
  const { event_id: selectedEventId } = await searchParams;

  // 1. Obtenemos todos los eventos
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, slug, start_time')
    .order('start_time', { ascending: false });

  const currentEventId = selectedEventId || (events && events.length > 0 ? events[0].id : null);
  const currentEvent = events?.find((e) => e.id === currentEventId);

  // 2. Consultamos datos del evento seleccionado
  let ordersQuery = supabaseAdmin.from('orders').select('*, events(title)').order('created_at', { ascending: false });
  let ticketsQuery = supabaseAdmin.from('issued_tickets').select('*, ticket_types(name, price), events(title)');
  let ticketTypesQuery = supabaseAdmin.from('ticket_types').select('*');
  let costsQuery = supabaseAdmin.from('event_costs').select('*').order('created_at', { ascending: false });

  if (currentEventId) {
    ordersQuery = ordersQuery.eq('event_id', currentEventId);
    ticketsQuery = ticketsQuery.eq('event_id', currentEventId);
    ticketTypesQuery = ticketTypesQuery.eq('event_id', currentEventId);
    costsQuery = costsQuery.eq('event_id', currentEventId);
  }

  const [{ data: orders }, { data: tickets }, { data: ticketTypes }, { data: costs }] = await Promise.all([
    ordersQuery,
    ticketsQuery,
    ticketTypesQuery,
    costsQuery,
  ]);

  // Cálculos Financieros y Operativos
  const completedOrders = (orders || []).filter((o) => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  // Potencial remanente si se agota todo el stock restante
  const projectedRemainingRevenue = (ticketTypes || []).reduce(
    (acc, t) => acc + Number(t.available_quota || 0) * (Number(t.price) + Number(t.service_fee || 0)),
    0
  );

  const totalCosts = (costs || []).reduce((acc, c) => acc + Number(c.amount || 0), 0);

  // Ganancia real hoy vs Proyectada al Sold-Out
  const netProfitActual = totalRevenue - totalCosts;
  const netProfitProjected = totalRevenue + projectedRemainingRevenue - totalCosts;

  const totalIssued = (tickets || []).length;
  const usedTickets = (tickets || []).filter((t) => t.status === 'USED').length;
  const totalCapacity = (ticketTypes || []).reduce((acc, t) => acc + Number(t.total_quota || 0), 0);
  const remainingCapacity = (ticketTypes || []).reduce((acc, t) => acc + Number(t.available_quota || 0), 0);

  const checkInRate = totalIssued > 0 ? Math.round((usedTickets / totalIssued) * 100) : 0;

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
              OASIS BACKSTAGE
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              Panel Financiero y Control
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/events/new"
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-bold text-neutral-950 transition-colors"
            >
              + Crear Evento
            </Link>
            <Link
              href="/scan"
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-white transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Scanner Puerta
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 transition-colors"
            >
              Cartelera
            </Link>
          </div>
        </div>

        {/* Selector de Eventos */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {(events || []).map((ev) => {
            const isSelected = ev.id === currentEventId;
            return (
              <Link
                key={ev.id}
                href={`/admin?event_id=${ev.id}`}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-lg shadow-amber-400/10'
                    : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                {ev.title}
              </Link>
            );
          })}
        </div>

        {/* Tarjetas de Métricas Financieras (P&L) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-xs uppercase font-semibold text-neutral-400">Recaudación Real</span>
            <div className="text-2xl font-bold text-emerald-400 mt-2">
              ${totalRevenue.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {completedOrders.length} ventas cobradas
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-xs uppercase font-semibold text-neutral-400">Costos Totales</span>
            <div className="text-2xl font-bold text-red-400 mt-2">
              ${totalCosts.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {(costs || []).length} gastos registrados
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-xs uppercase font-semibold text-neutral-400">Ganancia Neta Actual</span>
            <div
              className={`text-2xl font-bold mt-2 ${
                netProfitActual >= 0 ? 'text-emerald-400' : 'text-amber-500'
              }`}
            >
              ${netProfitActual.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Recaudación - Costos
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-xs uppercase font-semibold text-neutral-400">Proyección Sold-Out</span>
            <div className="text-2xl font-bold text-amber-400 mt-2">
              ${netProfitProjected.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              +${projectedRemainingRevenue.toLocaleString('es-AR')} remanente
            </span>
          </div>
        </div>

        {/* Sección de Gestión de Costos */}
        {currentEventId && (
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Estructura de Costos del Evento</h2>
                <p className="text-xs text-neutral-400">
                  Cargá los gastos del venue, técnica, artistas y staff para calcular el margen real.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400">Total Gastos:</span>
                <p className="text-base font-bold text-red-400 font-mono">
                  ${totalCosts.toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <CostManager eventId={currentEventId} initialCosts={costs || []} />
          </div>
        )}

        {/* Desglose de Tandas del Evento */}
        <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Tandas & Estimación por Vender</h2>
            <span className="text-xs text-amber-400 font-mono">
              Potencial: +${projectedRemainingRevenue.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(ticketTypes || []).map((type) => {
              const sold = Number(type.total_quota) - Number(type.available_quota);
              const percent = Number(type.total_quota) > 0 ? Math.round((sold / Number(type.total_quota)) * 100) : 0;
              const remainingValue = Number(type.available_quota) * Number(type.price);

              return (
                <div key={type.id} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{type.name}</span>
                    <span className="text-xs font-bold text-amber-400">
                      ${Number(type.price).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{sold} vendidas ({percent}%)</span>
                    <span>{type.available_quota} disponibles</span>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500">
                    <span>Valor remanente:</span>
                    <span className="font-mono text-neutral-300 font-semibold">
                      ${remainingValue.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabla de Órdenes del Evento */}
        <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Órdenes de este Evento</h2>
            <span className="text-xs text-neutral-400">{(orders || []).length} registradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="pb-3 font-semibold">Orden #</th>
                  <th className="pb-3 font-semibold">Monto</th>
                  <th className="pb-3 font-semibold">Estado</th>
                  <th className="pb-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {(orders || []).map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-900/80 transition-colors">
                    <td className="py-3 text-white font-bold">{order.order_number}</td>
                    <td className="py-3 text-emerald-400 font-bold">
                      ${Number(order.total_amount).toLocaleString('es-AR')}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-400">
                      {new Date(order.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}