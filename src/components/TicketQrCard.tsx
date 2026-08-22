'use client';

import { QRCodeSVG } from 'qrcode.react';

export function TicketQrCard({ ticket }: { ticket: any }) {
  const event = ticket.events;
  const tier = ticket.ticket_types;
  const isUsed = ticket.status === 'USED';

  const dateObj = event?.start_time ? new Date(event.start_time) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : 'Próximamente';

  const formattedTime = dateObj
    ? dateObj.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Mensaje para compartir por WhatsApp
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const waMessage = encodeURIComponent(
    `🎟️ ¡Hola! Acá está mi pase digital para *${event?.title || 'OASIS'}*:\n${shareUrl}`
  );

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Estado Superior */}
        <div
          className={`py-2.5 px-4 text-center text-xs font-black uppercase tracking-wider ${
            isUsed ? 'bg-rose-500/20 text-rose-400 border-b border-rose-500/30' : 'bg-amber-400 text-black'
          }`}
        >
          {isUsed ? 'PASE UTILIZADO / INGRESADO' : 'PASE VÁLIDO • ACCESO AUTORIZADO'}
        </div>

        {/* Información del Evento */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              {formattedDate} • {formattedTime} hs
            </span>
            <h1 className="text-xl font-black text-white tracking-tight uppercase mt-0.5">
              {event?.title || 'OASIS Experience'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              📍 {event?.venue_name} — <span className="text-neutral-500">{event?.venue_address}</span>
            </p>
          </div>

          {/* Contenedor del Código QR */}
          <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <QRCodeSVG
              value={ticket.ticket_code}
              size={190}
              level="H"
              includeMargin={false}
            />
            <span className="text-[10px] font-mono font-bold text-black mt-2 tracking-widest">
              {ticket.ticket_code}
            </span>
          </div>

          {/* Separador de corte con estilo ticket */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-dashed border-neutral-800" />
            <div className="absolute -left-9 w-6 h-6 rounded-full bg-black border-r border-neutral-800" />
            <div className="absolute -right-9 w-6 h-6 rounded-full bg-black border-l border-neutral-800" />
          </div>

          {/* Datos del Asistente */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Titular:</span>
              <span className="text-white font-bold capitalize">
                {ticket.attendee_first_name} {ticket.attendee_last_name}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">DNI:</span>
              <span className="text-white font-mono font-bold">{ticket.attendee_dni}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Tanda / Sector:</span>
              <span className="text-amber-400 font-bold">{tier?.name || 'General'}</span>
            </div>

            {ticket.is_courtesy && (
              <div className="pt-2 border-t border-neutral-900 flex justify-between items-center text-[10px]">
                <span className="text-neutral-600">Tipo de Emisión:</span>
                <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-bold">
                  CORTESÍA / VIP
                </span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-center text-neutral-600">
            Presentá este código QR directamente desde la pantalla de tu teléfono en la puerta del evento.
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10"
        >
          <span>💬</span> WhatsApp
        </a>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider border border-neutral-800 transition-all"
        >
          <span>📥</span> Guardar PDF
        </button>
      </div>
    </div>
  );
}