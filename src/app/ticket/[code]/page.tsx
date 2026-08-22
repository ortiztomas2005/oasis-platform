import HoloTicket from '@/components/HoloTicket';
import { supabaseAdmin } from '@/core/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const { data: ticket } = await supabaseAdmin
    .from('tickets')
    .select('*, events(*)')
    .eq('qr_hash', code)
    .single();

  if (!ticket) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-2">Ticket no encontrado</h1>
        <p className="text-neutral-400 text-sm mb-6">Verificá el enlace o contactá al organizador.</p>
        <Link href="/" className="px-5 py-2.5 bg-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-700">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <HoloTicket
          code={ticket.qr_hash}
          eventName={ticket.events?.name || 'Evento'}
          category={ticket.tier_name || 'GENERAL'}
          holderName={ticket.holder_name}
          date={new Date(ticket.events?.date).toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          status={ticket.status}
        />
        <div className="text-center mt-4">
          <Link href="/" className="text-xs font-mono text-neutral-500 hover:text-neutral-300">
            ← Volver a Experiencias OASIS
          </Link>
        </div>
      </div>
    </main>
  );
}