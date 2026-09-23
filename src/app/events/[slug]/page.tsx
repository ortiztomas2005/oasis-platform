'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import UserMenu from '@/components/UserMenu';
import { useSession } from '@/core/auth/useSession';

interface Tier {
  id: string;
  name: string;
  price: number;
  total_capacity?: number;
  available_capacity?: number;
  status?: string;
  show_stock_to_clients?: boolean;
  low_stock_threshold?: number;
  description?: string;
  entry_cutoff_time?: string;
}

interface EventData {
  id: string;
  name?: string;
  title?: string;
  date?: string;
  start_date?: string;
  venue?: string;
  venue_name?: string;
  image_url?: string;
  description?: string;
}

type PaymentMethodId = 'mp' | 'transfer' | 'card';

const PAYMENT_METHODS: { id: PaymentMethodId; name: string; icon: string }[] = [
  { id: 'mp', name: 'Mercado Pago', icon: '💙' },
  { id: 'card', name: 'Tarjeta de Débito / Crédito', icon: '💳' },
  { id: 'transfer', name: 'Transferencia Bancaria', icon: '⚡' },
];

// Antes esta página mostraba una lista de eventos hardcodeados en el código
// (DEFAULT_EVENTS) y, al "comprar", escribía tickets falsos directo a
// localStorage sin cobrar nada — el mismo problema que ya se había
// arreglado en la home page, pero acá seguía intacto y es la página a la
// que te manda /events al tocar "Comprar Pase".
export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useSession();

  const [event, setEvent] = useState<EventData | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>('mp');

  const [buyerName, setBuyerName] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{ references: string[]; total: number } | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/events/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.event) {
          setNotFound(true);
          return;
        }
        setEvent(data.event);
        setTiers(data.tiers || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (user) {
      setBuyerName(user.name);
      setBuyerEmail(user.email);
      setBuyerDni(user.dni);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070d] text-slate-100 flex items-center justify-center font-mono text-xs">
        Cargando evento...
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col items-center justify-center gap-4 font-mono text-xs">
        <p>No encontramos este evento.</p>
        <Link href="/events" className="px-5 py-2.5 bg-blue-600 rounded-xl text-white font-bold">
          Ver Cartelera →
        </Link>
      </div>
    );
  }

  const effectiveTiers: Tier[] = tiers.length > 0 ? tiers : [{ id: '', name: 'Acceso General', price: 15000 }];
  const currentTier = effectiveTiers[selectedTierIndex] || effectiveTiers[0];
  // Agotado si la productora lo marcó a mano (status) o si el stock real
  // ya llegó a 0 — antes solo se miraba el stock, así que marcar una
  // tanda "Agotada" a mano desde el panel no tenía ningún efecto acá.
  const isSoldOut =
    currentTier.status === 'SOLD_OUT' ||
    (currentTier.available_capacity !== undefined && currentTier.available_capacity <= 0);
  const lowStockCount =
    !isSoldOut &&
    currentTier.show_stock_to_clients !== false &&
    currentTier.available_capacity !== undefined &&
    currentTier.available_capacity <= (currentTier.low_stock_threshold ?? 10)
      ? currentTier.available_capacity
      : null;

  const subtotal = currentTier.price * quantity;
  const serviceCharge = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + serviceCharge;
  const activeMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment)!;
  const eventName = event.name || event.title || 'Evento Live Experience';
  const eventVenue = event.venue || event.venue_name || 'A confirmar';
  const eventDate = event.date || event.start_date;

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerDni || !buyerEmail) {
      alert('Completá tus datos para continuar.');
      return;
    }

    setIsCheckingOut(true);
    try {
      const endpoint =
        selectedPayment === 'transfer' ? '/api/checkout/transfer' : selectedPayment === 'card' ? '/api/checkout/astropay' : '/api/checkout/mercadopago';

      const references: string[] = [];
      let redirectUrl: string | null = null;

      for (let i = 0; i < quantity; i++) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            ticketTier: currentTier.name,
            amount: currentTier.price,
            customerName: buyerName.trim(),
            customerEmail: buyerEmail.toLowerCase().trim(),
            customerDni: buyerDni.trim(),
            userId: user?.id || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al registrar la orden');

        references.push(data.referenceCode);
        if (data.redirectUrl && !redirectUrl) redirectUrl = data.redirectUrl;
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setPurchaseResult({ references, total: totalAmount });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-[#0b1120]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/events"
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#161a26] hover:border-slate-700 text-slate-300 text-xs font-mono font-bold transition flex items-center gap-2"
            >
              <span>←</span>
              <span>Cartelera</span>
            </Link>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-white leading-none">LIVE EXPERIENCE</span>
              <span className="text-[9px] text-blue-400 font-mono tracking-wider mt-0.5">PASS CHECKOUT</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="pl-1.5 border-l border-slate-800">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1">
        {purchaseResult ? (
          <div className="max-w-xl mx-auto py-12 px-8 rounded-3xl bg-[#131722] border border-emerald-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
              ✅
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                Orden Registrada
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                ¡Ya casi está!
              </h1>
              <p className="text-xs text-slate-300 font-mono max-w-md mx-auto leading-relaxed">
                Tu compra para <strong className="text-white">{eventName}</strong> quedó en revisión. Apenas se
                confirme el pago vas a ver tus pases en "Mis Entradas".
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Referencia{purchaseResult.references.length > 1 ? 's' : ''}:</span>
                <span className="text-white font-bold text-right">{purchaseResult.references.join(', ')}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-white/5 pt-2">
                <span>Monto total:</span>
                <span className="text-emerald-400 font-black">${purchaseResult.total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 font-mono">
              <Link
                href="/my-tickets"
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl transition shadow-lg shadow-blue-600/30 text-center"
              >
                Ver Mis Entradas →
              </Link>
              <Link
                href="/events"
                className="py-3.5 px-6 border border-slate-800 bg-[#161a26] hover:bg-[#1d2333] text-slate-300 text-xs font-bold rounded-xl transition text-center"
              >
                Volver a la Cartelera
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* PORTADA Y DESCRIPCIÓN */}
            <div className="lg:col-span-7 space-y-8">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900 aspect-[16/10] shadow-2xl">
                <img
                  src={event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop'}
                  alt={eventName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-black/30" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-blue-400 font-bold block">
                    📅 {eventDate ? new Date(eventDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha a confirmar'} · {eventVenue}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none">
                    {eventName}
                  </h1>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {event.description || 'Sin descripción disponible.'}
                </p>
              </div>
            </div>

            {/* SELECCIÓN Y PAGO */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-3xl bg-[#131722] border border-slate-800/80 p-6 sm:p-7 space-y-6 shadow-2xl">
                <div>
                  <h2 className="text-lg font-black uppercase text-white tracking-wide">Seleccionar Pases</h2>
                  <p className="text-xs text-slate-400 font-mono">Elegí tu tanda y método de pago</p>
                </div>

                {/* Tandas */}
                <div className="space-y-3 font-mono">
                  {effectiveTiers.map((t, idx) => {
                    const sold =
                      t.status === 'SOLD_OUT' || (t.available_capacity !== undefined && t.available_capacity <= 0);
                    const showLow =
                      !sold &&
                      t.show_stock_to_clients !== false &&
                      t.available_capacity !== undefined &&
                      t.available_capacity <= (t.low_stock_threshold ?? 10);
                    const isSelected = selectedTierIndex === idx;

                    return (
                      <button
                        key={t.id || idx}
                        type="button"
                        disabled={sold}
                        onClick={() => setSelectedTierIndex(idx)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          sold
                            ? 'opacity-40 bg-black/20 border-slate-800 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10'
                            : 'bg-[#181d2a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-black uppercase text-white tracking-wider block">{t.name}</span>
                          {t.description && <span className="text-[11px] text-slate-500 block">{t.description}</span>}
                          <span className={`text-[11px] block ${showLow ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                            {sold ? 'Agotado' : showLow ? `¡Quedan ${t.available_capacity}!` : 'Disponible'}
                            {!sold && t.entry_cutoff_time ? ` · Ingreso hasta las ${t.entry_cutoff_time} hs` : ''}
                          </span>
                        </div>
                        <span className="text-base font-black text-white block">${t.price.toLocaleString('es-AR')}</span>
                      </button>
                    );
                  })}
                </div>

                {!isSoldOut && (
                  <>
                    {lowStockCount !== null && (
                      <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-mono text-center">
                        ⚠️ ¡Quedan solo {lowStockCount} entradas de "{currentTier.name}"!
                      </div>
                    )}

                    {/* Cantidad */}
                    <div className="flex items-center justify-between font-mono border-y border-slate-800/80 py-4">
                      <span className="text-xs text-slate-300 font-bold uppercase">Cantidad:</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-xl border border-slate-800 bg-[#181d2a] hover:bg-[#202738] text-white flex items-center justify-center text-sm font-bold transition"
                        >
                          -
                        </button>
                        <span className="text-base font-black text-white w-5 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(6, quantity + 1))}
                          className="w-8 h-8 rounded-xl border border-slate-800 bg-[#181d2a] hover:bg-[#202738] text-white flex items-center justify-center text-sm font-bold transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Datos del comprador */}
                    <div className="space-y-3 font-mono">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tus Datos</span>
                      <input
                        type="text" required placeholder="Nombre y Apellido" value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#181d2a] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" required placeholder="DNI" value={buyerDni}
                          onChange={(e) => setBuyerDni(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#181d2a] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                        />
                        <input
                          type="email" required placeholder="Email" value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#181d2a] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Medios de Pago */}
                    <div className="space-y-3 font-mono">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Medio de Pago</span>
                      <div className="space-y-2">
                        {PAYMENT_METHODS.map((method) => {
                          const isSelected = selectedPayment === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedPayment(method.id)}
                              className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                                isSelected ? 'bg-blue-600/10 border-blue-500 shadow-md' : 'bg-[#181d2a]/70 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{method.icon}</span>
                                <span className="text-xs font-bold text-white">{method.name}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resumen */}
                    <form onSubmit={handleBuy} className="space-y-5 font-mono">
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Subtotal ({quantity}x)</span>
                          <span className="text-white">${subtotal.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Cargos de Servicio (12%)</span>
                          <span className="text-white">${serviceCharge.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-white font-black text-sm border-t border-white/10 pt-2">
                          <span>Total Final</span>
                          <span className="text-emerald-400">${totalAmount.toLocaleString('es-AR')}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCheckingOut}
                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
                      >
                        {isCheckingOut ? 'Procesando...' : `Pagar con ${activeMethod.name} · $${totalAmount.toLocaleString('es-AR')} →`}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
