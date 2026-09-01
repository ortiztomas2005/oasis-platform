'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import UserMenu from '@/components/UserMenu';

export interface Tier {
  name: string;
  price: number;
  capacity?: number;
  soldCount?: number;
  entryCutoffTime?: string;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  imageUrl: string;
  slug: string;
  genre?: string;
  description?: string;
  barEnabled?: boolean;
  tiers?: Tier[];
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    name: 'OASIS Sunset Edition',
    date: 'Sáb 15 Oct · 18:00 HS',
    venue: 'PMRC Club · Puerto Madero',
    city: 'Buenos Aires',
    genre: 'Melodic Techno',
    imageUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    slug: 'oasis-sunset',
    barEnabled: true,
    description:
      'Apertura de temporada exclusiva frente al dique. Acústica de precisión, puesta de luces volumétrica, sector backstage y consumo en barra por QR sin filas.',
    tiers: [
      { name: 'Early Bird', price: 12000, capacity: 150, soldCount: 150, entryCutoffTime: '20:00' },
      { name: 'General T1', price: 15000, capacity: 500, soldCount: 420, entryCutoffTime: '22:00' },
      { name: 'VIP Backstage', price: 25000, capacity: 100, soldCount: 88 },
    ],
  },
  {
    id: 'ev-2',
    name: 'Neo Warehouse Nightline',
    date: 'Vie 28 Nov · 23:30 HS',
    venue: 'Underground Studio · Distrito Tech',
    city: 'Buenos Aires',
    genre: 'Industrial & Hypnotic',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    slug: 'neo-warehouse',
    barEnabled: true,
    description:
      'Extended set internacional, montaje industrial de iluminación volumétrica y servicio de barra móvil integrado.',
    tiers: [
      { name: 'General Acceso', price: 14000, capacity: 400, soldCount: 190 },
      { name: 'VIP Lounge', price: 22000, capacity: 80, soldCount: 45 },
    ],
  },
  {
    id: 'ev-3',
    name: 'Patagonia Bass & Beats',
    date: 'Sáb 12 Dic · 21:00 HS',
    venue: 'Club de la Costa · Golfo Nuevo',
    city: 'Puerto Madryn',
    genre: 'House & Deep Groove',
    imageUrl:
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200&auto=format&fit=crop',
    slug: 'patagonia-bass',
    barEnabled: true,
    description:
      'Puesta en escena frente al mar con vista directa al golfo, sonido envolvente y validación digital nominada.',
    tiers: [
      { name: 'Acceso General', price: 11000, capacity: 250, soldCount: 240 },
      { name: 'Sector VIP', price: 18000, capacity: 60, soldCount: 55 },
    ],
  },
  {
    id: 'ev-4',
    name: 'Sideral Open Air',
    date: 'Vie 05 Dic · 19:00 HS',
    venue: 'Valle Central Park',
    city: 'Córdoba',
    genre: 'Progressive House',
    imageUrl:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
    slug: 'sideral-open-air',
    barEnabled: false,
    description:
      'Apertura al aire libre con visuales panorámicas y sonido de alta fidelidad.',
    tiers: [
      { name: 'Early Bird', price: 13000, capacity: 200, soldCount: 95 },
      { name: 'General', price: 16500, capacity: 600, soldCount: 110 },
    ],
  },
];

const PAYMENT_METHODS = [
  { id: 'mp', name: 'Mercado Pago', icon: '💙' },
  { id: 'card', name: 'Tarjeta de Débito / Crédito', icon: '💳' },
  { id: 'transfer', name: 'Transferencia Bancaria / MODO', icon: '⚡' },
];

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPayment, setSelectedPayment] = useState<string>('mp');
  const [currentUser, setCurrentUser] = useState<{ name: string; dni: string }>({
    name: 'Santiago Rossi',
    dni: '42.190.231',
  });
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('oasis_local_events');
      const allEvents: EventItem[] = stored ? JSON.parse(stored) : DEFAULT_EVENTS;
      const found = allEvents.find(
        (e) => e.slug === slug || e.id === slug
      );
      setEvent(found || allEvents[0]);

      const storedUser = localStorage.getItem('oasis_current_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUser({
            name: parsed.name || parsed.fullName || 'Santiago Rossi',
            dni: parsed.dni || '42.190.231',
          });
        } catch {}
      }
    } catch {
      setEvent(DEFAULT_EVENTS[0]);
    }
  }, [slug]);

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center font-mono text-xs">
        Cargando evento...
      </div>
    );
  }

  const tiers = event.tiers && event.tiers.length > 0 ? event.tiers : [
    { name: 'Acceso General', price: 15000, capacity: 500, soldCount: 120 }
  ];

  const currentTier = tiers[selectedTierIndex] || tiers[0];
  const isSoldOut = (currentTier.soldCount || 0) >= (currentTier.capacity || 9999);
  
  const subtotal = currentTier.price * quantity;
  const serviceCharge = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + serviceCharge;
  const activeMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);

    setTimeout(() => {
      try {
        const storedTickets = JSON.parse(localStorage.getItem('oasis_tickets') || '[]');
        const newTickets = Array.from({ length: quantity }).map((_, i) => {
          const randId = Math.floor(1000 + Math.random() * 9000);
          return {
            id: `tk-${Date.now()}-${i}`,
            qrCode: `OASIS-TK-${randId}`,
            eventName: event.name,
            tierName: currentTier.name,
            ownerName: currentUser.name,
            ownerDni: currentUser.dni,
            paymentMethod: activeMethod?.name || 'Mercado Pago',
            status: 'active' as const,
            purchasedAt: new Date().toLocaleDateString('es-AR'),
          };
        });

        localStorage.setItem('oasis_tickets', JSON.stringify([...storedTickets, ...newTickets]));

        const storedEvents: EventItem[] = JSON.parse(
          localStorage.getItem('oasis_local_events') || JSON.stringify(DEFAULT_EVENTS)
        );
        const evIndex = storedEvents.findIndex((e) => e.id === event.id || e.slug === event.slug);
        if (evIndex !== -1 && storedEvents[evIndex].tiers) {
          storedEvents[evIndex].tiers![selectedTierIndex].soldCount =
            (storedEvents[evIndex].tiers![selectedTierIndex].soldCount || 0) + quantity;
          localStorage.setItem('oasis_local_events', JSON.stringify(storedEvents));
        }

        setIsCheckingOut(false);
        setPurchaseSuccess(true);
      } catch (err) {
        console.error(err);
        setIsCheckingOut(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-[#0f131c]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#161a26] hover:border-slate-700 text-slate-300 text-xs font-mono font-bold transition flex items-center gap-2"
            >
              <span>←</span>
              <span>Cartelera</span>
            </Link>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-white leading-none">
                OASIS
              </span>
              <span className="text-[9px] text-blue-400 font-mono tracking-wider mt-0.5">
                PASS CHECKOUT
              </span>
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
        {purchaseSuccess ? (
          <div className="max-w-xl mx-auto py-12 px-8 rounded-3xl bg-[#131722] border border-emerald-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
              ✅
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                Operación Aprobada
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                ¡Pases Emitidos!
              </h1>
              <p className="text-xs text-slate-300 font-mono max-w-md mx-auto leading-relaxed">
                Tus entradas para <strong className="text-white">{event.name}</strong> ya se encuentran disponibles en tu cuenta.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Tanda:</span>
                <span className="text-white font-bold">{currentTier.name} ({quantity}x)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Medio de Pago:</span>
                <span className="text-blue-400 font-bold">{activeMethod?.name}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-white/5 pt-2">
                <span>Monto total abonado:</span>
                <span className="text-emerald-400 font-black">${totalAmount.toLocaleString('es-AR')}</span>
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
                href="/"
                className="py-3.5 px-6 border border-slate-800 bg-[#161a26] hover:bg-[#1d2333] text-slate-300 text-xs font-bold rounded-xl transition text-center"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* PORTADA Y DESCRIPCIÓN */}
            <div className="lg:col-span-7 space-y-8">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900 aspect-[16/10] shadow-2xl">
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-transparent to-black/30" />
                
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 font-mono text-[10px]">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10 font-bold uppercase">
                    📍 {event.city}
                  </span>
                  {event.genre && (
                    <span className="px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30 backdrop-blur-md font-bold uppercase">
                      {event.genre}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-blue-400 font-bold block">
                    📅 {event.date} · {event.venue}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none">
                    {event.name}
                  </h1>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {event.description}
                </p>
              </div>
            </div>

            {/* SELECCIÓN Y PAGO */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-3xl bg-[#131722] border border-slate-800/80 p-6 sm:p-7 space-y-6 shadow-2xl">
                <div>
                  <h2 className="text-lg font-black uppercase text-white tracking-wide">
                    Seleccionar Pases
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Elegí tu tanda y método de pago
                  </p>
                </div>

                {/* Tandas */}
                <div className="space-y-3 font-mono">
                  {tiers.map((t, idx) => {
                    const sold = (t.soldCount || 0) >= (t.capacity || 9999);
                    const isSelected = selectedTierIndex === idx;

                    return (
                      <button
                        key={idx}
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
                          <span className="text-xs font-black uppercase text-white tracking-wider block">
                            {t.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {sold ? 'Agotado' : 'Disponible'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-white block">
                            ${t.price.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Cantidad */}
                {!isSoldOut && (
                  <div className="flex items-center justify-between font-mono border-y border-slate-800/80 py-4">
                    <span className="text-xs text-slate-300 font-bold uppercase">
                      Cantidad:
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-xl border border-slate-800 bg-[#181d2a] hover:bg-[#202738] text-white flex items-center justify-center text-sm font-bold transition"
                      >
                        -
                      </button>
                      <span className="text-base font-black text-white w-5 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(6, quantity + 1))}
                        className="w-8 h-8 rounded-xl border border-slate-800 bg-[#181d2a] hover:bg-[#202738] text-white flex items-center justify-center text-sm font-bold transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Medios de Pago */}
                {!isSoldOut && (
                  <div className="space-y-3 font-mono">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Medio de Pago
                    </span>

                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = selectedPayment === method.id;

                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedPayment(method.id)}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-500 shadow-md'
                                : 'bg-[#181d2a]/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{method.icon}</span>
                              <span className="text-xs font-bold text-white">
                                {method.name}
                              </span>
                            </div>

                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resumen */}
                {!isSoldOut && (
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
                      className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition shadow-xl shadow-blue-600/30 disabled:opacity-50"
                    >
                      {isCheckingOut ? 'Procesando...' : `Pagar con ${activeMethod?.name} · $${totalAmount.toLocaleString('es-AR')} →`}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}