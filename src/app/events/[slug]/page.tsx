import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/core/supabase/admin';
import { TicketSelector } from '@/components/TicketSelector';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Obtener Evento por Slug
  const { data: event, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !event) {
    notFound();
  }

  // 2. Obtener Tandas de Tickets
  const { data: ticketTypes } = await supabaseAdmin
    .from('ticket_types')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_visible', true)
    .order('price', { ascending: true });

  const dateObj = new Date(event.start_time);
  const formattedDate = dateObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header Back */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/"
          className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
        >
          ← Volver a Cartelera
        </Link>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Info del Evento */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-black uppercase tracking-wider">
              {formattedDate} • {formattedTime} hs
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              {event.title}
            </h1>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-300 font-semibold">
              <span>📍</span>
              <span>{event.venue_name}</span>
            </div>
            <p className="text-xs text-neutral-500 pl-6">{event.venue_address}</p>
          </div>

          {event.description && (
            <div className="space-y-2 text-sm text-neutral-400 leading-relaxed">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Información del Evento
              </h3>
              <p>{event.description}</p>
            </div>
          )}
        </div>

        {/* Selector y Compra */}
        <div className="lg:col-span-5">
          <TicketSelector eventId={event.id} ticketTypes={ticketTypes || []} />
        </div>
      </main>
    </div>
  );
}