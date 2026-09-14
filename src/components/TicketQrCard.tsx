'use client';

import React from 'react';

interface TicketCardProps {
  ticket: {
    id: string;
    eventName: string;
    tierName: string;
    price: number;
    holderName: string;
    holderDni: string;
    holderMemberNumber?: string;
    qrToken: string;
    status: 'VALID' | 'USED' | 'CANCELLED';
    purchasedAt: string;
    clubName?: string;
  };
}

export default function TicketQrCard({ ticket }: TicketCardProps) {
  
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticket.qrToken)}`;

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permití las ventanas emergentes (pop-ups) para descargar el PDF.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Pase Digital - Live Experience Deportes</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          
          @page {
            size: auto;
            margin: 0;
          }

          html, body {
            background-color: #07070a !important;
            color: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
            height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .ticket-card {
            width: 400px;
            background: #0c0f17;
            border: 2px solid #f59e0b;
            border-radius: 24px;
            padding: 28px;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .club-title {
            font-family: 'Cinzel', serif;
            font-size: 13px;
            color: #f59e0b;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .event-title {
            font-family: 'Cinzel', serif;
            font-size: 18px;
            font-weight: 900;
            margin-top: 6px;
            text-transform: uppercase;
          }
          .info-group {
            margin-bottom: 12px;
          }
          .label {
            font-size: 9px;
            text-transform: uppercase;
            color: #94a3b8;
            font-weight: 700;
          }
          .value {
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 2px;
          }
          .qr-box {
            background: #ffffff;
            padding: 16px;
            border-radius: 16px;
            text-align: center;
            margin-top: 20px;
          }
          .qr-image {
            width: 140px;
            height: 140px;
            display: block;
            margin: 0 auto;
          }
          .qr-token {
            font-family: monospace;
            font-size: 12px;
            font-weight: 900;
            color: #000000;
            margin-top: 8px;
            letter-spacing: 2px;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            color: #64748b;
            margin-top: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="header">
            <div class="club-title">Live Experience Deportes</div>
            <div class="event-title">${ticket.eventName}</div>
          </div>
          
          <div class="info-group">
            <div class="label">Ubicación / Sector</div>
            <div class="value" style="color: #f59e0b;">${ticket.tierName}</div>
          </div>

          <div class="info-group">
            <div class="label">Titular (Nominativo / No Transferible)</div>
            <div class="value">${ticket.holderName} (DNI: ${ticket.holderDni})</div>
          </div>

          ${ticket.holderMemberNumber ? `
          <div class="info-group">
            <div class="label">Número de Socio</div>
            <div class="value" style="color: #10b981;">#${ticket.holderMemberNumber}</div>
          </div>` : ''}

          <div class="qr-box">
            <img src="${qrImageUrl}" alt="Código QR" class="qr-image" />
            <div class="qr-token">${ticket.qrToken}</div>
          </div>

          <div class="footer">
            Entrada estrictamente nominativa e intransferible.
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 600);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎟️ *LIVE EXPERIENCE DEPORTES*\n\n` +
      `⚽ *Encuentro:* ${ticket.eventName}\n` +
      `🏟️ *Sector:* ${ticket.tierName}\n` +
      `👤 *Titular Nominativo:* ${ticket.holderName} (DNI: ${ticket.holderDni})\n` +
      `${ticket.holderMemberNumber ? `⭐ *Socio N°:* ${ticket.holderMemberNumber}\n` : ''}` +
      `🔑 *Token QR:* \`${ticket.qrToken}\`\n\n` +
      `_Entrada intransferible. Presentá este mensaje o el QR en el ingreso._`
    );

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const isUsed = ticket.status === 'USED';

  return (
    <div className="w-full max-w-sm bg-[#0c0f17] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5 font-mono relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* ENCABEZADO */}
      <div className="flex justify-between items-start border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
            LIVE EXPERIENCE DEPORTES
          </span>
          <h3 className="font-luxury text-base font-black text-white uppercase tracking-wide mt-1">
            {ticket.eventName}
          </h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
          isUsed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}>
          {isUsed ? '✓ Utilizado' : 'Válido'}
        </span>
      </div>

      {/* DETALLES */}
      <div className="space-y-3 text-xs">
        <div>
          <span className="text-slate-500 block uppercase text-[10px]">Ubicación / Sector</span>
          <strong className="text-amber-400 text-sm font-bold">{ticket.tierName}</strong>
        </div>

        <div>
          <span className="text-slate-500 block uppercase text-[10px]">Titular Nominativo</span>
          <strong className="text-white">{ticket.holderName} (DNI: {ticket.holderDni})</strong>
        </div>

        {ticket.holderMemberNumber && (
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Número de Socio</span>
            <strong className="text-emerald-400">#{ticket.holderMemberNumber}</strong>
          </div>
        )}
      </div>

      {/* ZONA DEL QR EN BLANCO */}
      <div className="p-4 rounded-2xl bg-white text-slate-900 text-center space-y-2 shadow-inner flex flex-col items-center justify-center">
        <div className="font-bold text-[9px] tracking-widest text-slate-500 uppercase">Código QR de Acceso</div>
        <img 
          src={qrImageUrl} 
          alt="QR Token" 
          className="w-32 h-32 object-contain mx-auto rounded-lg"
        />
        <div className="font-mono text-xs font-black tracking-widest text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
          {ticket.qrToken}
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleDownloadPdf}
          className="py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-[11px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
        >
          <span>🖨️</span> Imprimir / PDF
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
        >
          <span>💬</span> WhatsApp
        </button>
      </div>

    </div>
  );
}