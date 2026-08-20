import Link from 'next/link';
import { getPublishedEventsByOrg } from '@/core/services/events';

export default async function Home() {
  const events = await getPublishedEventsByOrg('oasis');

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex items-center justify-between pb-8 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">OASIS</h1>
          <p className="text-neutral-400 text-sm">Plataforma de Gestión y Ticketing</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-neutral-300 font-medium">Supabase Conectado</span>
        </div>
      </header>

      <section className="w-full max-w-4xl mt-10">
        <h2 className="text-xl font-semibold mb-4 text-neutral-200">Próximos Eventos</h2>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center bg-neutral-900/40">
            <p className="text-neutral-400 text-base font-medium">
              No hay eventos publicados actualmente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group p-5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-900 hover:border-neutral-700 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">{event.venue_name}</p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {new Date(event.start_time).toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">
                    Comprar entradas →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
