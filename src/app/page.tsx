import Link from 'next/link';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 1. Obtener eventos
  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error.message || error);
  }

  // 2. Obtener todas las tandas para calcular precios mínimos
  const { data: ticketTypes } = await supabaseAdmin
    .from('ticket_types')
    .select('event_id, price');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-400 selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold tracking-[0.3em] text-amber-400 uppercase">
          TICKETING & HIGH-VOLUME ACCESS
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
          Experiencias <span className="text-amber-400">OASIS</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">
          Plataforma oficial de acceso directo, validación criptográfica y tickets digitales para eventos exclusivos.
        </p>
      </section>

      {/* Cartelera de Eventos */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-8">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Próximos Eventos</h2>
          <span className="text-xs text-neutral-500 font-mono">{events?.length || 0} disponibles</span>
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventTiers = (ticketTypes || []).filter((t) => t.event_id === event.id);
              const prices = eventTiers.map((t) => Number(t.price));
              const minPrice = prices.length > 0 ? Math.min(...prices) : null;
              const dateObj = new Date(event.start_time);

              const formattedDate = dateObj.toLocaleDateString('es-AR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const formattedTime = dateObj.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-amber-400/50 transition-all overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-amber-400/5"
                >
                  <div className="h-44 bg-neutral-950 border-b border-neutral-800/80 p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent opacity-80" />
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider">
                        {formattedDate} • {formattedTime} hs
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">OASIS</span>
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs text-neutral-400 font-medium">{event.venue_name}</p>
                      <p className="text-[11px] text-neutral-600 truncate">{event.venue_address}</p>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Desde</span>
                        <span className="text-base font-black text-amber-400 font-mono">
                          {minPrice !== null ? `$${minPrice.toLocaleString('es-AR')}` : 'Consultar'}
                        </span>
                      </div>

                      <span className="px-4 py-2 rounded-xl bg-neutral-800 group-hover:bg-amber-400 group-hover:text-black text-xs font-bold transition-all">
                        Comprar Pase →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-neutral-800">
            <p className="text-neutral-500 text-sm">No hay eventos publicados por el momento.</p>
          </div>
        )}
      </main>
    </div>
  );
}