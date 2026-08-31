'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EventDetailPage() {
  const params = useParams();
  const rawSlug = (params?.slug as string) || '';

  const [event, setEvent] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Formulario Comprador
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  useEffect(() => {
    if (rawSlug) fetchEventData();
  }, [rawSlug]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events-data', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const found = (data.events || []).find(
          (e: any) =>
            e.slug === rawSlug ||
            e.id === rawSlug ||
            e.name?.toLowerCase().replace(/\s+/g, '-') === rawSlug.toLowerCase() ||
            rawSlug.includes(e.id)
        );

        if (found) {
          setEvent(found);

          const rawTiers = (found.ticket_tiers && found.ticket_tiers.length > 0)
            ? found.ticket_tiers
            : (data.tiers || []).filter((t: any) => t.event_id === found.id);

          // FILTRO ESTRICTO: NO MOSTRAR SI ESTÁ PAUSADA / OCULTA
          const visibleTiers = rawTiers.filter((t: any) => t.status !== 'PAUSED');
          setTiers(visibleTiers);

          const firstActive = visibleTiers.find((t: any) => t.status === 'ACTIVE');
          if (firstActive) {
            setSelectedTier(firstActive);
          } else if (visibleTiers.length > 0) {
            setSelectedTier(visibleTiers[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier || selectedTier.status !== 'ACTIVE' || !name || !email || !dni) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          tierId: selectedTier.id,
          tierName: selectedTier.name,
          customerName: name,
          customerEmail: email,
          customerDni: dni,
          quantity,
          paymentMethod: 'TRANSFER',
          receiptUrl: 'https://oasis-ticketing.com/manual-receipt',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessOrder(data);
      } else {
        alert(data.error || 'Error al procesar la reserva');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex items-center justify-center font-mono text-xs">
        Cargando tandas oficiales...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-center space-y-4 font-mono">
        <p className="text-neutral-400 text-sm">Evento no encontrado o finalizado.</p>
        <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl">
          ← Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050811] text-white font-sans antialiased">
      <header className="border-b border-blue-950/60 bg-[#050811]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-oasis.png" alt="OASIS" className="h-10 w-auto invert brightness-200 object-contain" />
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link href="/my-tickets" className="px-4 py-2 bg-blue-600 text-white font-bold uppercase rounded-xl">
              Mis Entradas
            </Link>
            <Link href="/admin" className="px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-300">
              Backstage
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-mono">
        <div className="bg-[#0A0F1D] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-2">
          <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">Evento Oficial</span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-white">{event.name || event.title}</h1>
          <p className="text-xs text-neutral-400">
            📍 {event.venue || 'Buenos Aires'} • 📅 {event.date ? new Date(event.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Próximamente'}
          </p>
        </div>

        {successOrder ? (
          <div className="bg-[#0A0F1D] border border-emerald-500/40 rounded-3xl p-8 text-center space-y-4">
            <span className="text-4xl">🎉</span>
            <h2 className="text-2xl font-black uppercase text-white">¡Reserva Confirmada!</h2>
            <p className="text-xs text-neutral-300 max-w-md mx-auto">
              Se ha emitido el pase para <strong>{name}</strong>. Podés acceder al QR en Mis Entradas.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Link href="/my-tickets" className="px-6 py-3 bg-blue-600 text-white font-bold uppercase text-xs rounded-xl">
                Ver en Mis Entradas
              </Link>
              <Link href="/" className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white font-bold uppercase text-xs rounded-xl">
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBuy} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0A0F1D] border border-blue-950 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase text-blue-400">1. Seleccionar Tanda</h3>

              {tiers.length === 0 ? (
                <div className="p-6 border border-dashed border-blue-950 rounded-2xl text-center text-xs text-neutral-500">
                  No hay tandas a la venta en este momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {tiers.map((t) => {
                    const isSoldOut = t.status === 'SOLD_OUT';
                    const isSelected = selectedTier?.id === t.id || selectedTier?.name === t.name;

                    return (
                      <button
                        type="button"
                        key={t.id || t.name}
                        disabled={isSoldOut}
                        onClick={() => setSelectedTier(t)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center ${
                          isSoldOut
                            ? 'opacity-40 border-neutral-900 bg-black/40 cursor-not-allowed'
                            : isSelected
                            ? 'border-blue-500 bg-blue-950/30 shadow-md shadow-blue-500/10'
                            : 'border-blue-950/60 bg-black/40 hover:border-blue-900'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-white text-xs uppercase">{t.name}</p>
                          <p className={`text-[10px] font-bold ${isSoldOut ? 'text-rose-400' : 'text-neutral-500'}`}>
                            {isSoldOut ? '● AGOTADO' : t.description || 'Acceso Oficial'}
                          </p>
                        </div>
                        <span className="font-black text-blue-400 text-sm">
                          ${Number(t.price).toLocaleString('es-AR')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTier && selectedTier.status === 'ACTIVE' && (
                <div className="pt-4 border-t border-blue-950 flex justify-between items-center">
                  <span className="text-xs text-neutral-400">Cantidad:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-white">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(6, quantity + 1))}
                      className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#0A0F1D] border border-blue-950 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase text-blue-400">2. Datos de Acreditación</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/60 border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">DNI del Titular</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 44123456"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full bg-black/60 border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej: juan@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 border-t border-blue-950">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-neutral-400">Total:</span>
                    <span className="text-lg font-black text-white">
                      ${selectedTier ? (selectedTier.price * quantity).toLocaleString('es-AR') : 0}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedTier || selectedTier.status !== 'ACTIVE'}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-600/25"
                  >
                    {submitting ? 'Procesando...' : 'Confirmar Pase'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}