import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/core/supabase/admin';
import { TicketQrCard } from '@/components/TicketQrCard';

export const dynamic = 'force-dynamic';

export default async function TicketViewPage(props: {
  params: Promise<{ code: string }> | { code: string };
}) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params;
  const rawCode = resolvedParams?.code;

  if (!rawCode) {
    notFound();
  }

  const code = decodeURIComponent(rawCode).trim().toUpperCase();

  // 1. Obtener el ticket directamente por ticket_code
  const { data: ticket, error: ticketErr } = await supabaseAdmin
    .from('issued_tickets')
    .select('*')
    .ilike('ticket_code', code)
    .single();

  if (ticketErr || !ticket) {
    console.error('Ticket not found in DB:', code, ticketErr);
    notFound();
  }

  // 2. Obtener datos del Evento
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('title, venue_name, venue_address, start_time')
    .eq('id', ticket.event_id)
    .single();

  // 3. Obtener datos de la Tanda (Ticket Type)
  const { data: ticketType } = await supabaseAdmin
    .from('ticket_types')
    .select('name, price')
    .eq('id', ticket.ticket_type_id)
    .single();

  const ticketPayload = {
    ...ticket,
    events: event || {
      title: 'OASIS Experience',
      venue_name: 'Locación Confirmada',
      venue_address: 'Dirección de Acceso',
      start_time: new Date().toISOString(),
    },
    ticket_types: ticketType || {
      name: ticket.is_courtesy ? 'Cortesía VIP' : 'General',
      price: 0,
    },
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-amber-400 selection:text-black">
      {/* Header OASIS */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <Link href="/" className="text-sm font-black tracking-widest text-amber-400">
          ● OASIS.
        </Link>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
          Official Digital Pass
        </span>
      </div>

      {/* Ticket Card */}
      <TicketQrCard ticket={ticketPayload} />
    </div>
  );
}