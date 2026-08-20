'use client';

import { useState } from 'react';
import { TicketType } from '@/types/database';

interface AttendeeData {
  ticketTypeId: string;
  ticketName: string;
  firstName: string;
  lastName: string;
  dni: string;
}

interface TicketSelectorProps {
  ticketTypes: TicketType[];
  eventId: string;
}

export function TicketSelector({ ticketTypes, eventId }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'SELECT' | 'ATTENDEES'>('SELECT');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [orderSummary, setOrderSummary] = useState<{
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    expiresAt: string;
  } | null>(null);

  const updateQuantity = (id: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const totalTickets = Object.values(quantities).reduce((acc, q) => acc + q, 0);

  const subtotal = ticketTypes.reduce((acc, ticket) => {
    const qty = quantities[ticket.id] || 0;
    return acc + Number(ticket.price) * qty;
  }, 0);

  const totalFee = ticketTypes.reduce((acc, ticket) => {
    const qty = quantities[ticket.id] || 0;
    return acc + Number(ticket.service_fee) * qty;
  }, 0);

  const grandTotal = subtotal + totalFee;

  const handleProceedToAttendees = () => {
    if (totalTickets === 0) return;

    const list: AttendeeData[] = [];
    ticketTypes.forEach((ticket) => {
      const qty = quantities[ticket.id] || 0;
      for (let i = 0; i < qty; i++) {
        list.push({
          ticketTypeId: ticket.id,
          ticketName: ticket.name,
          firstName: '',
          lastName: '',
          dni: '',
        });
      }
    });

    setAttendees(list);
    setStep('ATTENDEES');
  };

  const updateAttendee = (index: number, field: keyof AttendeeData, value: string) => {
    setAttendees((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const items = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketTypeId, quantity]) => ({
          ticketTypeId,
          quantity,
        }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          items,
          buyerEmail,
          attendees,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al iniciar la orden');
        return;
      }

      setOrderSummary(data);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async () => {
    if (!orderSummary) return;
    setIsRedirecting(true);

    try {
      const res = await fetch('/api/checkout/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderSummary.orderId,
          buyerEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentUrl) {
        alert(data.error || 'Error al generar el link de pago en Mercado Pago');
        setIsRedirecting(false);
        return;
      }

      // Redirección directa al checkout de Mercado Pago
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error(err);
      alert('No se pudo conectar con la pasarela de pagos');
      setIsRedirecting(false);
    }
  };

  if (orderSummary) {
    return (
      <div className="p-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
          <span className="text-sm uppercase font-bold tracking-wider text-emerald-400">
            Orden #{orderSummary.orderNumber}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            Pendiente de Pago
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-neutral-300 text-sm">
            Monto final: <strong className="text-white text-2xl font-bold">${orderSummary.totalAmount.toLocaleString('es-AR')}</strong>
          </p>
          <p className="text-xs text-neutral-400">
            Entradas reservadas durante 15 minutos para <strong className="text-white">{buyerEmail}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={isRedirecting}
          className="w-full mt-4 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {isRedirecting ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago →'}
        </button>
      </div>
    );
  }

  if (step === 'ATTENDEES') {
    return (
      <form onSubmit={handleCheckout} className="space-y-6">
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
          <h3 className="text-base font-semibold text-white">Datos del Comprador</h3>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Email donde recibirás los tickets</label>
            <input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white">Nominación de Entradas ({attendees.length})</h3>
          {attendees.map((att, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
              <span className="text-xs font-semibold text-amber-400">
                Ticket #{idx + 1} - {att.ticketName}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre"
                  value={att.firstName}
                  onChange={(e) => updateAttendee(idx, 'firstName', e.target.value)}
                  className="px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Apellido"
                  value={att.lastName}
                  onChange={(e) => updateAttendee(idx, 'lastName', e.target.value)}
                  className="px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  required
                  placeholder="DNI / Documento"
                  value={att.dni}
                  onChange={(e) => updateAttendee(idx, 'dni', e.target.value)}
                  className="px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep('SELECT')}
            className="px-5 py-3 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 text-sm font-semibold transition-colors"
          >
            ← Volver
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Generando orden...' : `Confirmar y pagar $${grandTotal.toLocaleString('es-AR')}`}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ticketTypes.map((ticket) => {
          const qty = quantities[ticket.id] || 0;
          const isSoldOut = ticket.available_quota <= 0;

          return (
            <div
              key={ticket.id}
              className={`p-5 rounded-xl border transition-all ${
                qty > 0
                  ? 'border-amber-500/50 bg-neutral-900'
                  : 'border-neutral-800 bg-neutral-900/60'
              } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-base">{ticket.name}</h3>
                  {isSoldOut && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      Agotado
                    </span>
                  )}
                </div>
                {ticket.description && (
                  <p className="text-xs text-neutral-400 mt-1">{ticket.description}</p>
                )}
                <p className="text-xs text-neutral-500 mt-2">
                  Máximo {ticket.max_per_order} por compra
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-800">
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    ${Number(ticket.price).toLocaleString('es-AR')}
                  </div>
                  {Number(ticket.service_fee) > 0 && (
                    <div className="text-[11px] text-neutral-400">
                      + ${Number(ticket.service_fee).toLocaleString('es-AR')} cargo serv.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => updateQuantity(ticket.id, -1, ticket.max_per_order)}
                    disabled={qty === 0 || isSoldOut}
                    className="w-8 h-8 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors font-bold text-lg"
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-sm font-semibold text-white">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(ticket.id, 1, ticket.max_per_order)}
                    disabled={qty >= ticket.max_per_order || isSoldOut}
                    className="w-8 h-8 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalTickets > 0 && (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
              Total ({totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'})
            </div>
            <div className="text-2xl font-bold text-white">
              ${grandTotal.toLocaleString('es-AR')}
            </div>
            <div className="text-[11px] text-neutral-500">
              Incluye ${totalFee.toLocaleString('es-AR')} de cargo por servicio
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceedToAttendees}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg active:scale-[0.98]"
          >
            Continuar con la compra →
          </button>
        </div>
      )}
    </div>
  );
}