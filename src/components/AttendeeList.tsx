'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';

interface TicketItem {
  id: string;
  holder_name: string;
  holder_dni: string;
  holder_email?: string;
  tier_name: string;
  qr_hash: string;
  status: string;
  purchase_price?: number;
  created_at?: string;
}

interface AttendeeListProps {
  eventId?: string;
  tickets?: TicketItem[];
}

export function AttendeeList({ eventId, tickets = [] }: AttendeeListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.holder_name && t.holder_name.toLowerCase().includes(search.toLowerCase())) ||
      (t.holder_dni && t.holder_dni.includes(search)) ||
      (t.qr_hash && t.qr_hash.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VALID' && t.status === 'VALID') ||
      (statusFilter === 'USED' && t.status === 'USED') ||
      (statusFilter === 'FROZEN_RESALE' && t.status === 'FROZEN_RESALE');

    return matchesSearch && matchesStatus;
  });

  const getTicketUrl = (qrHash: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/ticket/${qrHash}`;
    }
    return `/ticket/${qrHash}`;
  };

  const handleCopyLink = (qrHash: string) => {
    const url = getTicketUrl(qrHash);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = (t: TicketItem) => {
    const url = getTicketUrl(t.qr_hash);
    const message = encodeURIComponent(
      `¡Hola ${t.holder_name}! 🎉 Acá tenés tu entrada digital para el evento.\n\nAcceso: ${t.tier_name}\nDNI: ${t.holder_dni}\n\nIngresá al siguiente link para ver tu código QR de acceso:\n${url}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 mb-8 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Nómina de Asistentes & Control de Acceso</h2>
          <p className="text-xs text-neutral-400 font-mono">Buscador en tiempo real de pases emitidos.</p>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por DNI, Nombre o Código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:col-span-2 bg-black/60 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-neutral-500 focus:border-amber-400 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black/60 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-amber-400 outline-none"
        >
          <option value="ALL">Todos ({tickets.length})</option>
          <option value="VALID">Válidos</option>
          <option value="USED">Ingresados</option>
          <option value="FROZEN_RESALE">En Reventa</option>
        </select>
      </div>

      {/* Tabla de Asistentes */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-500 uppercase text-[10px]">
              <th className="pb-3 px-2">Asistente</th>
              <th className="pb-3 px-2">DNI</th>
              <th className="pb-3 px-2">Tanda / Tipo</th>
              <th className="pb-3 px-2">Código Pase</th>
              <th className="pb-3 px-2 text-center">Estado</th>
              <th className="pb-3 px-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500">
                  No se encontraron asistentes con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-2">
                    <span className="font-bold text-white block">{t.holder_name}</span>
                    <span className="text-[10px] text-neutral-500">{t.holder_email || 'Sin email'}</span>
                  </td>
                  <td className="py-3.5 px-2 text-neutral-300">{t.holder_dni}</td>
                  <td className="py-3.5 px-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-bold uppercase">
                      {t.tier_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-neutral-400 text-[11px] truncate max-w-[120px]">
                    {t.qr_hash ? t.qr_hash.substring(0, 12) + '...' : '-'}
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        t.status === 'VALID'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : t.status === 'USED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {t.status === 'VALID' ? 'VÁLIDO' : t.status === 'USED' ? 'INGRESÓ' : 'EN REVENTA'}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-amber-400 hover:text-black rounded-lg text-[11px] font-semibold text-neutral-200 transition-all"
                    >
                      👁 Ver / Enviar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLE DE TICKET CON QR Y BOTONES DE ENVÍO */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Detalle del Pase Digital
              </span>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setCopied(false);
                }}
                className="text-neutral-500 hover:text-white text-base leading-none"
              >
                ✕
              </button>
            </div>

            {/* Código QR */}
            <div className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-inner mb-4">
              <QRCode value={selectedTicket.qr_hash} size={160} />
            </div>

            {/* Datos del Asistente */}
            <div className="space-y-2 text-xs font-mono bg-black/50 p-4 rounded-2xl border border-neutral-800/80 mb-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">TITULAR:</span>
                <span className="font-bold text-white">{selectedTicket.holder_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">DNI:</span>
                <span className="text-neutral-300">{selectedTicket.holder_dni}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">ACCESO:</span>
                <span className="text-yellow-400 font-bold">{selectedTicket.tier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">ESTADO:</span>
                <span className={selectedTicket.status === 'USED' ? 'text-emerald-400 font-bold' : 'text-blue-400 font-bold'}>
                  {selectedTicket.status === 'USED' ? 'INGRESADO' : 'VÁLIDO'}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 truncate pt-1 border-t border-neutral-800">
                HASH: {selectedTicket.qr_hash}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2 font-mono">
              <button
                onClick={() => handleSendWhatsApp(selectedTicket)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                <span>💬</span> Enviar por WhatsApp
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyLink(selectedTicket.qr_hash)}
                  className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition-all"
                >
                  {copied ? '✓ ¡Copiado!' : '📋 Copiar Link'}
                </button>
                <a
                  href={getTicketUrl(selectedTicket.qr_hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 border border-amber-400/30 font-semibold text-xs rounded-xl text-center transition-all flex items-center justify-center"
                >
                  Abrir Ticket ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendeeList;