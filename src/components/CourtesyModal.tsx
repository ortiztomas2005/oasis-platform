'use client';

import { useState } from 'react';

interface CourtesyModalProps {
  eventId: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CourtesyModal({
  eventId,
  eventName,
  isOpen,
  onClose,
  onSuccess,
}: CourtesyModalProps) {
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderDni, setHolderDni] = useState('');
  const [tierName, setTierName] = useState('VIP INVITADO');
  const [loading, setLoading] = useState(false);
  const [generatedTicketUrl, setGeneratedTicketUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/tickets/courtesy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          holder_name: holderName,
          holder_email: holderEmail,
          holder_dni: holderDni,
          tier_name: tierName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir cortesía');

      // Tomamos el hash QR devuelto por la API
      const qrCode = data.ticket?.qr_hash || data.qr_hash || data.code;
      const fullUrl = `${window.location.origin}/ticket/${qrCode}`;
      
      setGeneratedTicketUrl(fullUrl);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedTicketUrl) return;
    navigator.clipboard.writeText(generatedTicketUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetAndClose = () => {
    setGeneratedTicketUrl(null);
    setHolderName('');
    setHolderEmail('');
    setHolderDni('');
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl">
        
        {/* VISTA 1: ENLACE GENERADO */}
        {generatedTicketUrl ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold">¡Cortesía Emitida con Éxito!</h3>
              <p className="text-xs text-neutral-400 font-mono mt-1">Para: {holderName}</p>
            </div>

            <div className="bg-black/60 border border-neutral-800 rounded-2xl p-3 text-left">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Enlace del Ticket Digital</span>
              <p className="text-xs font-mono text-amber-400 truncate select-all">{generatedTicketUrl}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? '✓ ¡Copiado!' : '📋 Copiar Enlace'}
              </button>
              <a
                href={generatedTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-bold font-mono text-center flex items-center justify-center transition-all"
              >
                Abrir Ticket ↗
              </a>
            </div>

            <button
              onClick={handleResetAndClose}
              className="text-xs text-neutral-500 hover:text-neutral-300 font-mono pt-2 block mx-auto"
            >
              Cerrar y volver al panel
            </button>
          </div>
        ) : (
          /* VISTA 2: FORMULARIO DE EMISIÓN */
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold">Emitir Cortesía / Invitación</h3>
                <p className="text-xs text-neutral-400 font-mono">{eventName}</p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Martín Gómez"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Email de Destino</label>
                <input
                  type="email"
                  required
                  placeholder="ej: martin@oasis.com"
                  value={holderEmail}
                  onChange={(e) => setHolderEmail(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase">DNI / Documento</label>
                <input
                  type="text"
                  required
                  placeholder="ej: 42123456"
                  value={holderDni}
                  onChange={(e) => setHolderDni(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Tipo de Acceso</label>
                <select
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400 outline-none"
                >
                  <option value="VIP INVITADO">VIP INVITADO</option>
                  <option value="BACKSTAGE">BACKSTAGE</option>
                  <option value="ACCESO GENERAL">ACCESO GENERAL</option>
                  <option value="STAFF / PRENSA">STAFF / PRENSA</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {loading ? 'Generando Pase...' : 'Generar Ticket'}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}