'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TicketTypeOption {
  id: string;
  name: string;
}

interface CourtesyModalProps {
  eventId: string;
  ticketTypes: TicketTypeOption[];
}

export function CourtesyModal({ eventId, ticketTypes }: CourtesyModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTypeId || !firstName || !lastName || !dni || !email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/courtesy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketTypeId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dni: dni.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFirstName('');
        setLastName('');
        setDni('');
        setEmail('');
        setIsOpen(false);
        router.refresh();
      } else {
        alert(data.error || 'Error al emitir cortesía');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-bold transition-all flex items-center gap-1.5"
      >
        <span>+ Emitir Cortesía / VIP</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Pase Especial
                </span>
                <h3 className="text-base font-bold text-white">Emitir Cortesía / Invitación</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
                  Tipo de Pase
                </label>
                <select
                  value={ticketTypeId}
                  onChange={(e) => setTicketTypeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Rossi"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sin puntos"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="invitado@oasis.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-bold transition-colors"
                >
                  {isSubmitting ? 'Generando...' : 'Generar Pase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}