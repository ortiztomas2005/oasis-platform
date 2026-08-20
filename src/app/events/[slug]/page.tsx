import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/core/services/events';
import { TicketSelector } from '@/components/TicketSelector';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug('oasis', slug);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1 mb-8"
        >
          ← Volver a eventos
        </Link>

        {/* Encabezado del Evento */}
        <div className="border-b border-neutral-800 pb-8 mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            {event.status}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-2">
            {event.title}
          </h1>
          <p className="text-neutral-400 mt-2 text-base leading-relaxed">
            {event.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm text-neutral-300">
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="block text-xs text-neutral-500 mb-1">Fecha y Hora</span>
              <p className="font-medium">
                {new Date(event.start_time).toLocaleString('es-AR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="block text-xs text-neutral-500 mb-1">Ubicación</span>
              <p className="font-medium">{event.venue_name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{event.venue_address}</p>
            </div>
          </div>
        </div>

        {/* Selección Interactiva de Entradas */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Seleccionar Entradas</h2>
          <TicketSelector
            ticketTypes={event.ticket_types || []}
            eventId={event.id}
          />
        </section>
      </div>
    </main>
  );
}