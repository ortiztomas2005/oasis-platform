import HoloTicket from '@/components/HoloTicket';
import ResaleModal from '@/components/ResaleModal';
import { supabaseAdmin } from '@/core/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // 1. Buscar primero por qr_hash
  let { data: ticket } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('qr_hash', code)
    .maybeSingle();

  // 2. Fallback por UUID si aplica
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
  if (!ticket && isUuid) {
    const { data: ticketById } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', code)
      .maybeSingle();
    ticket = ticketById;
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-2">Ticket no encontrado</h1>
        <p className="text-neutral-400 text-xs font-mono mb-6 max-w-xs">
          Verificá el enlace o que el ticket no haya sido reemitido por una reventa.
        </p>
        <Link href="/" className="px-5 py-2.5 bg-neutral-800 rounded-xl text-xs font-mono hover:bg-neutral-700">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // 3. Obtener datos del evento
  let eventName = 'Evento OASIS';
  let eventDate = 'Fecha a confirmar';

  if (ticket.event_id) {
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', ticket.event_id)
      .maybeSingle();

    if (event) {
      eventName = event.name || eventName;
      if (event.date) {
        eventDate = new Date(event.date).toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
      }
    }
  }

  const holderName = ticket.holder_name || ticket.customer_name || 'Asistente';
  const tierName = ticket.tier_name || ticket.tier || 'GENERAL';
  const qrValue = ticket.qr_hash || ticket.id;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <HoloTicket
          code={qrValue}
          eventName={eventName}
          category={tierName}
          holderName={holderName}
          date={eventDate}
          status={ticket.status || 'VALID'}
        />

        {ticket.status === 'VALID' && (
          <ResaleModal
            ticketId={ticket.id}
            originalPrice={Number(ticket.purchase_price || ticket.price || 0)}
          />
        )}

        {ticket.status === 'FROZEN_RESALE' && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <span className="text-xs text-yellow-400 font-mono">
              ⚠️ Este ticket se encuentra publicado en el Marketplace de Reventa.
            </span>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/my-tickets" className="text-xs font-mono text-neutral-500 hover:text-neutral-300">
            ← Ver todas mis entradas
          </Link>
        </div>
      </div>
    </main>
  );
}