'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TicketTier {
  id: string;
  name: string;
  price: number;
  description: string | null;
  available_quota: number;
}

interface AttendeeData {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
}

export function TicketSelector({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketTier[];
}) {
  const router = useRouter();
  const [selectedTierId, setSelectedTierId] = useState<string>(
    ticketTypes.length > 0 ? ticketTypes[0].id : ''
  );
  const [quantity] = useState<number>(1);
  const [attendee, setAttendee] = useState<AttendeeData>({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  const activeTier = ticketTypes.find((t) => t.id === selectedTierId);
  const unitPrice = activeTier ? Number(activeTier.price) : 0;
  const totalPrice = unitPrice * quantity;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTierId || !attendee.firstName || !attendee.lastName || !attendee.dni || !attendee.email) {
      alert('Por favor completá todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketTypeId: selectedTierId,
          quantity,
          attendee,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticketCode) {
        // Redirigir directamente al Ticket Digital del comprador
        router.push(`/ticket/${data.ticketCode}`);
      } else {
        alert('Error: ' + (data.error || 'No se pudo procesar la compra'));
      }
    } catch {
      alert('Error de conexión con la pasarela de pagos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      <div>
        <h3 className="text-base font-bold text-white uppercase tracking-wider">Seleccioná tu Entrada</h3>
        <p className="text-xs text-neutral-500">Tickets digitales nominados intransferibles con QR único.</p>
      </div>

      {/* Selector de Tandas */}
      <div className="space-y-2.5">
        {ticketTypes.map((tier) => {
          const isSelected = tier.id === selectedTierId;
          const isSoldOut = tier.available_quota <= 0;

          return (
            <div
              key={tier.id}
              onClick={() => !isSoldOut && setSelectedTierId(tier.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSoldOut
                  ? 'opacity-40 cursor-not-allowed bg-neutral-950 border-neutral-900'
                  : isSelected
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-400/5'
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{tier.name}</span>
                  {isSoldOut && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                      AGOTADO
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-xs text-neutral-400">{tier.description}</p>
                )}
              </div>

              <div className="text-right font-mono">
                <span className="text-base font-black text-amber-400">
                  ${Number(tier.price).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  {tier.available_quota} disponibles
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formulario del Titular */}
      <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-neutral-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Datos del Asistente (Ingreso con DNI)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="Nombre"
            value={attendee.firstName}
            onChange={(e) => setAttendee({ ...attendee, firstName: e.target.value })}
            className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            required
            placeholder="Apellido"
            value={attendee.lastName}
            onChange={(e) => setAttendee({ ...attendee, lastName: e.target.value })}
            className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            required
            placeholder="DNI (sin puntos)"
            value={attendee.dni}
            onChange={(e) => setAttendee({ ...attendee, dni: e.target.value })}
            className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
          />
          <input
            type="email"
            required
            placeholder="Email (para recibir el QR)"
            value={attendee.email}
            onChange={(e) => setAttendee({ ...attendee, email: e.target.value })}
            className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Resumen Total y Botón */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">Total a Pagar</span>
            <span className="text-2xl font-black text-white font-mono">
              ${totalPrice.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedTierId}
            className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-400/10"
          >
            {loading ? 'Procesando...' : 'Comprar Entrada →'}
          </button>
        </div>
      </form>
    </div>
  );
}