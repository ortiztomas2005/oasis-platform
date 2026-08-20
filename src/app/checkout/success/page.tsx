import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/core/supabase/admin';
import { QRCodeSVG } from 'qrcode.react';

interface SuccessPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order_id } = await searchParams;

  if (!order_id) {
    notFound();
  }

  // 1. Buscamos la orden y sus datos relacionados
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, events(*)')
    .eq('id', order_id)
    .single();

  if (!order) {
    notFound();
  }

  // 2. Buscamos los tickets emitidos para esta orden
  const { data: tickets } = await supabaseAdmin
    .from('issued_tickets')
    .select('*, ticket_types(*)')
    .eq('order_id', order_id);

  const event = (order as any).events;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Cabecera de Confirmación */}
        <div className="text-center pb-8 border-b border-neutral-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">¡Compra Confirmada!</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Orden #{order.order_number} • Guardá tus entradas para ingresar
          </p>
        </div>

        {/* Detalle del Evento */}
        <div className="my-8 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
              Evento
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">{event?.title || 'OASIS Event'}</h2>
            <p className="text-xs text-neutral-400 mt-1">{event?.venue_name}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-neutral-500">Fecha</span>
            <p className="text-sm font-semibold text-neutral-200">
              {event?.start_time
                ? new Date(event.start_time).toLocaleDateString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'}
            </p>
          </div>
        </div>

        {/* Listado de Entradas con Códigos QR */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Tus Credenciales de Acceso</h3>

          {tickets && tickets.length > 0 ? (
            tickets.map((ticket, idx) => {
              const ticketData = (ticket as any).ticket_types;
              const qrPayload = JSON.stringify({
                ticketId: ticket.id,
                secret: ticket.secret_token,
                org: ticket.organization_id,
              });

              return (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl"
                >
                  <div className="bg-white p-3 rounded-xl shadow-inner">
                    <QRCodeSVG value={qrPayload} size={140} level="M" />
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Pase #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white">
                      {ticketData?.name || 'Entrada General'}
                    </h4>

                    <p className="text-xs text-neutral-400 font-mono">
                      ID: {ticket.id.slice(0, 18)}...
                    </p>

                    <p className="text-[11px] text-neutral-500">
                      Presentá este código QR en la entrada directamente desde tu celular.
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 text-neutral-400 text-sm">
              Estamos procesando la emisión de tus pases digitales...
            </div>
          )}
        </div>

        {/* Botón de regreso */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            ← Volver a la cartelera principal
          </Link>
        </div>
      </div>
    </main>
  );
}