'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketQrCard({ ticket, token }: { ticket?: any; token?: string }) {
  // Estado para los colores institucionales dinámicos
  const [clubColors, setClubColors] = useState({
    primary: '#f59e0b', // Color por defecto (ambar)
    accent: '#fbbf24',
  });

  useEffect(() => {
    const updateClubColors = () => {
      try {
        const config = JSON.parse(localStorage.getItem('oasis_club_config') || localStorage.getItem('le_club_config') || '{}');
        if (config.primaryColor || config.accentColor) {
          setClubColors({
            primary: config.primaryColor || '#f59e0b',
            accent: config.accentColor || '#fbbf24',
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    updateClubColors();
    window.addEventListener('storage', updateClubColors);
    return () => window.removeEventListener('storage', updateClubColors);
  }, []);

  if (!ticket && !token) return null;

  const event = ticket?.events;
  const tier = ticket?.ticket_types;
  const isUsed = ticket?.status === 'USED';

  const ticketCode = token || ticket?.ticket_code || ticket?.qrToken || ticket?.qrCode || ticket?.id || 'PASS';

  const dateObj = event?.start_time ? new Date(event.start_time) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : ticket?.purchasedAt || 'Próximamente';

  const formattedTime = dateObj
    ? dateObj.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const waMessage = encodeURIComponent(
    `🎟️ ¡Hola! Acá está mi pase oficial para el partido *${event?.title || ticket?.eventName || 'Club Sport'}*:\n${shareUrl}`
  );

  return (
    <div className="w-full max-w-sm space-y-4 font-mono">
      <div 
        className={`bg-neutral-900 border rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300`}
        style={{
          borderColor: isUsed ? 'rgba(244, 63, 94, 0.4)' : `${clubColors.accent}60`,
          boxShadow: isUsed ? 'none' : `0 15px 40px -10px ${clubColors.accent}25`
        }}
      >
        {/* Estado Superior */}
        <div
          className={`py-2.5 px-4 text-center text-xs font-black uppercase tracking-wider`}
          style={{
            backgroundColor: isUsed ? 'rgba(244, 63, 94, 0.2)' : clubColors.accent,
            color: isUsed ? '#f43f5e' : '#000000',
            borderBottom: isUsed ? '1px solid rgba(244, 63, 94, 0.3)' : 'none'
          }}
        >
          {isUsed ? 'PASE UTILIZADO / INGRESADO' : '● ACCESO OFICIAL DEPORTIVO'}
        </div>

        {/* Información del Partido / Evento */}
        <div className="p-6 space-y-4">
          <div>
            <span 
              className={`text-[10px] font-bold uppercase tracking-widest block`}
              style={{ color: isUsed ? '#f43f5e' : clubColors.primary }}
            >
              {formattedDate} {formattedTime ? `• ${formattedTime} hs` : ''}
            </span>
            <h1 className="text-xl font-black text-white tracking-tight uppercase mt-0.5">
              {event?.title || ticket?.eventName || 'Encuentro Deportivo'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              🏟️ {event?.venue_name || ticket?.tierName || 'Estadio del Club'} {event?.venue_address ? `— ${event.venue_address}` : ''}
            </p>
          </div>

          {/* Contenedor del Código QR */}
          <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <QRCodeSVG
              value={ticketCode}
              size={190}
              level="H"
              includeMargin={false}
              fgColor="#000000"
            />
            <span className="text-[10px] font-mono font-bold text-black mt-2 tracking-widest">
              {ticketCode}
            </span>
          </div>

          {/* Separador de corte estilo ticket */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-dashed border-neutral-800" />
            <div className="absolute -left-9 w-6 h-6 rounded-full bg-neutral-900 border-r border-neutral-800" />
            <div className="absolute -right-9 w-6 h-6 rounded-full bg-neutral-900 border-l border-neutral-800" />
          </div>

          {/* Datos del Socio / Hinchada */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Titular:</span>
              <span className="text-white font-bold capitalize">
                {ticket?.attendee_first_name ? `${ticket.attendee_first_name} ${ticket.attendee_last_name || ''}` : ticket?.holderName || ticket?.ownerName || 'Socio'}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">DNI:</span>
              <span className="text-white font-mono font-bold">{ticket?.attendee_dni || ticket?.holderDni || ticket?.ownerDni || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Sector / Tribuna:</span>
              <span className="font-bold" style={{ color: clubColors.primary }}>
                {tier?.name || ticket?.tierName || 'General'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-center text-neutral-600">
            Escaneá este código QR en los molinetes de ingreso al estadio.
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <span>💬</span> Compartir
        </a>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider border border-neutral-800 transition-all cursor-pointer"
        >
          <span>📥</span> Descargar
        </button>
      </div>
    </div>
  );
}