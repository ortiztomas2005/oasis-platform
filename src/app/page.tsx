import { supabaseAdmin } from '@/core/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Consulta flexible a la tabla events
  let events: any[] = [];
  
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*');

  if (error) {
    console.error('Error al traer eventos de Supabase:', error);
  } else if (data) {
    events = data;
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero */}
        <div className="text-center py-12 sm:py-16 space-y-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
            Ticketing & High-Volume Access
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Experiencias <span className="text-yellow-400">OASIS</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono max-w-xl mx-auto leading-relaxed">
            Plataforma oficial de acceso directo, validación criptográfica y tickets digitales nominados.
          </p>
        </div>

        {/* Sección Eventos */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-300">
              Próximos Eventos
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {events.length} {events.length === 1 ? 'disponible' : 'disponibles'}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="border border-dashed border-neutral-800 rounded-3xl p-12 text-center bg-neutral-900/20">
              <p className="text-sm font-mono text-neutral-400">No hay eventos cargados por el momento.</p>
              <Link
                href="/admin"
                className="inline-block mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-white rounded-xl"
              >
                Crear Evento en Backstage →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => {
                const dateText = ev.date
                  ? new Date(ev.date).toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Próximamente';

                return (
                  <div
                    key={ev.id}
                    className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all rounded-3xl p-6 flex flex-col justify-between shadow-2xl"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="bg-yellow-400 text-black font-black text-[10px] font-mono px-3 py-1 rounded-full uppercase">
                          {dateText}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                          OASIS
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-mono text-neutral-400 block mb-1">
                          📍 {ev.venue || 'Ubicación central'}
                        </span>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                          {ev.name}
                        </h3>
                      </div>

                      <p className="text-xs text-neutral-400 font-mono line-clamp-2 leading-relaxed">
                        {ev.description || 'Entradas nominadas intransferibles con validación QR.'}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-neutral-800/80 mt-6 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-neutral-500 block uppercase">Desde</span>
                        <span className="text-lg font-bold font-mono text-yellow-400">
                          ${Number(ev.base_price || 15000).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <Link
                        href={`/events/${ev.slug}`}
                        className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold font-mono text-xs uppercase rounded-xl transition-all shadow-md shadow-yellow-400/10"
                      >
                        Comprar Entrada →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}