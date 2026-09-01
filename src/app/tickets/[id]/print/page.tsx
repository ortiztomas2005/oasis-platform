'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface Ticket {
  id: string;
  eventName: string;
  tierName: string;
  date: string;
  venue: string;
  holderName: string;
  holderDni: string;
  holderEmail: string;
  qrToken: string;
  status: string;
  price: number;
  entryCutoffTime?: string;
  purchaseDate: string;
}

export default function TicketDownloadPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('oasis_issued_tickets');
      if (stored) {
        const all: Ticket[] = JSON.parse(stored);
        const found = all.find((t) => t.id === ticketId);
        if (found) {
          setTicket(found);
          QRCode.toDataURL(found.qrToken, {
            width: 300,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          }).then((url) => setQrDataUrl(url));
        }
      }
    } catch (e) {
      console.warn('Error leyendo ticket');
    }
  }, [ticketId]);

  const handleDownloadDirectPDF = async () => {
    if (!ticket) return;
    setDownloading(true);

    try {
      // Generar QR en base64 de alta resolución
      const qrBase64 = await QRCode.toDataURL(ticket.qrToken, {
        width: 400,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });

      // Crear documento PDF nativo (80mm x 150mm formato Pase/Entrada)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [90, 165],
      });

      // Fondo general oscuro
      doc.setFillColor(9, 13, 22); // #090d16
      doc.roundedRect(4, 4, 82, 157, 4, 4, 'F');

      // Cabecera Azul
      doc.setFillColor(29, 78, 216); // #1d4ed8
      doc.roundedRect(4, 4, 82, 28, 4, 4, 'F');
      doc.rect(4, 20, 82, 12, 'F'); // tapar curva inferior

      // Textos de Cabecera
      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.text('PASE OFICIAL DE ACCESO · OASIS', 8, 11);

      doc.setFontSize(11);
      doc.text(ticket.eventName.toUpperCase().substring(0, 24), 8, 18);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(220, 220, 220);
      doc.text(ticket.venue.substring(0, 35), 8, 24);

      // Datos de Asistente
      let y = 38;
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(140, 140, 140);
      doc.text('TITULAR NOMINATIVO', 8, y);
      doc.text('DNI REGISTRADO', 48, y);

      y += 5;
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(ticket.holderName.toUpperCase().substring(0, 18), 8, y);
      doc.setTextColor(52, 211, 153); // Emerald
      doc.text(ticket.holderDni, 48, y);

      y += 8;
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(140, 140, 140);
      doc.text('TANDA / TIER', 8, y);
      doc.text('FECHA', 48, y);

      y += 5;
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(96, 165, 250); // Blue 400
      doc.text(ticket.tierName.toUpperCase().substring(0, 18), 8, y);
      doc.setTextColor(255, 255, 255);
      doc.text(ticket.date.substring(0, 18), 48, y);

      // Marco del Código QR
      y += 8;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(22, y, 46, 46, 3, 3, 'F');
      doc.addImage(qrBase64, 'PNG', 24, y + 2, 42, 42);

      // Token
      y += 51;
      doc.setFont('courier', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(140, 140, 140);
      doc.text('TOKEN CRIPTOGRAFICO', 45, y, { align: 'center' });

      y += 4;
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(ticket.qrToken, 45, y, { align: 'center' });

      // Caja de Reglas / Aviso
      y += 6;
      doc.setFillColor(0, 0, 0);
      doc.roundedRect(8, y, 74, 18, 2, 2, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(170, 170, 170);
      doc.text('• Presentar junto al DNI fisico original en puerta.', 10, y + 5);
      if (ticket.entryCutoffTime) {
        doc.setTextColor(251, 191, 36); // Amber
        doc.text(`• Limite de ingreso estricto: ${ticket.entryCutoffTime} HS.`, 10, y + 9);
      } else {
        doc.text('• Pase valido durante toda la noche.', 10, y + 9);
      }
      doc.setTextColor(170, 170, 170);
      doc.text('• Prohibida su reventa fuera de OASIS.', 10, y + 13);

      // Pie
      doc.setFontSize(5);
      doc.setTextColor(100, 100, 100);
      doc.text(`ID: ${ticket.id} | OASIS SECURITY PASS`, 45, 156, { align: 'center' });

      // Guardar PDF
      const cleanName = ticket.eventName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Pase_${cleanName}_${ticket.holderDni}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center font-mono text-xs">
        Buscando pase oficial...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-4 sm:p-8 font-mono flex flex-col items-center justify-center">
      {/* BARRA SUPERIOR DE ACCIÓN */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 transition-colors"
        >
          ← Volver
        </button>

        <button
          onClick={handleDownloadDirectPDF}
          disabled={downloading}
          className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 uppercase flex items-center gap-2 transition-all hover:scale-105"
        >
          {downloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <span>📥</span>
              <span>Descargar Pase PDF</span>
            </>
          )}
        </button>
      </div>

      {/* VISTA PREVIA EN PANTALLA */}
      <div className="max-w-md w-full bg-[#090d16] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex justify-between items-start">
          <div>
            <span className="text-[9px] uppercase tracking-widest block font-bold opacity-80">
              PASE OFICIAL DE ACCESO · OASIS
            </span>
            <h1 className="text-xl font-black uppercase mt-1 leading-tight">{ticket.eventName}</h1>
            <p className="text-[11px] opacity-90 mt-0.5">📍 {ticket.venue}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg">
            O
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block font-bold">Fecha & Hora</span>
              <span className="text-xs font-bold text-white">{ticket.date}</span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block font-bold">Tanda / Tipo</span>
              <span className="text-xs font-bold text-blue-400 uppercase">{ticket.tierName}</span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block font-bold">Titular</span>
              <span className="text-xs font-bold text-white uppercase">{ticket.holderName}</span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block font-bold">DNI Verificado</span>
              <span className="text-xs font-bold text-emerald-400">{ticket.holderDni}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 py-2">
            <div className="w-48 h-48 bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg border border-neutral-700">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={ticket.qrToken} className="w-full h-full object-contain" />
              ) : (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="text-center">
              <span className="text-[9px] text-neutral-500 uppercase block font-bold tracking-widest">
                TOKEN CRIPTOGRÁFICO
              </span>
              <span className="text-xs font-bold text-white tracking-wider font-mono">
                {ticket.qrToken}
              </span>
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-neutral-800 text-[10px] space-y-1 text-neutral-400">
            <p>• Presentar este pase junto al DNI físico original en el molinete de acceso.</p>
            {ticket.entryCutoffTime ? (
              <p className="text-amber-400 font-bold">
                • Horario estricto de ingreso: Válido hasta las {ticket.entryCutoffTime} HS.
              </p>
            ) : (
              <p>• Pase válido durante toda la noche.</p>
            )}
            <p>• Prohibida su reventa fuera del mercado oficial OASIS.</p>
          </div>
        </div>

        <div className="border-t border-neutral-800/80 p-4 bg-neutral-900/40 text-center text-[9px] text-neutral-500">
          ID: {ticket.id} · Emitido el {new Date(ticket.purchaseDate).toLocaleDateString('es-AR')}
        </div>
      </div>
    </div>
  );
}