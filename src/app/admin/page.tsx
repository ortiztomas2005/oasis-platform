import Link from 'next/link';
import { supabaseAdmin } from '@/core/supabase/admin';
import { CourtesyModal } from '@/components/CourtesyModal';
import { AttendeeList } from '@/components/AttendeeList';
import { CostManager } from '@/components/CostManager';
import { CreateEventModal } from '@/components/CreateEventModal';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ event_id?: string }> | { event_id?: string };
}) {
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;

  // 1. Obtener eventos
  const { data: events, error: eventsError } = await supabaseAdmin
    .from('events')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (eventsError || !events || events.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-neutral-400">No hay eventos configurados en el sistema.</p>
        <CreateEventModal />
      </div>
    );
  }

  const activeEventId = resolvedParams?.event_id || events[0].id;

  // 2. Obtener tandas de tickets
  const { data: ticketTypes } = await supabaseAdmin
    .from('ticket_types')
    .select('*')
    .eq('event_id', activeEventId);

  // 3. Obtener tickets emitidos
  const { data: issuedTickets } = await supabaseAdmin
    .from('issued_tickets')
    .select('*, ticket_types(name, price)')
    .eq('event_id', activeEventId);

  // 4. Obtener órdenes pagadas
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('total_amount, status')
    .eq('event_id', activeEventId)
    .eq('status', 'PAID');

  // 5. Obtener estructura de costos
  const { data: costs } = await supabaseAdmin
    .from('event_costs')
    .select('*')
    .eq('event_id', activeEventId);

  // --- CÁLCULOS ---
  const ticketsList = issuedTickets || [];
  const totalIssued = ticketsList.length;
  const totalCheckedIn = ticketsList.filter((t) => t.status === 'USED').length;
  const checkInRate = totalIssued > 0 ? Math.round((totalCheckedIn / totalIssued) * 100) : 0;

  const grossRevenue = (orders || []).reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
  const projectedRevenue = (ticketTypes || []).reduce(
    (acc, curr) => acc + Number(curr.price || 0) * Number(curr.total_quota || 0),
    0
  );
  const totalExpenses = (costs || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netProfit = grossRevenue - totalExpenses;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Selector de Evento y Botón Crear */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
              OASIS BACKSTAGE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Control Operativo & Financiero
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <CreateEventModal />

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {events.map((ev) => {
                const isSelected = ev.id === activeEventId;
                return (
                  <Link
                    key={ev.id}
                    href={`/admin?event_id=${ev.id}`}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/10'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {ev.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Recaudación Real
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ${grossRevenue.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {orders?.length || 0} ventas cobradas
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Ganancia Neta Actual
            </span>
            <p
              className={`text-2xl sm:text-3xl font-black font-mono ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${netProfit.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Gastos cargados: ${totalExpenses.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Pases Emitidos
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">{totalIssued}</p>
            <span className="text-[11px] text-amber-400 font-medium mt-1 block">
              Proyección: ${projectedRevenue.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Check-ins en Puerta
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">{totalCheckedIn}</p>
              <span className="text-xs font-bold text-emerald-400">({checkInRate}%)</span>
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">Ingresados al recinto</span>
          </div>
        </div>

        {/* Nómina de Asistentes */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Nómina de Asistentes & Control de Acceso</h2>
              <p className="text-xs text-neutral-500">
                Buscador en tiempo real de pases emitidos y exportación para control offline en puerta.
              </p>
            </div>
            <CourtesyModal eventId={activeEventId} ticketTypes={ticketTypes || []} />
          </div>

          <AttendeeList eventId={activeEventId} tickets={ticketsList} />
        </div>

        {/* Gastos y Costos */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
          <CostManager eventId={activeEventId} initialCosts={costs || []} />
        </div>
      </main>
    </div>
  );
}