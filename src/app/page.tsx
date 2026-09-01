'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  city?: string;
  imageUrl: string;
  slug?: string;
  genre?: string;
  description?: string;
  demandScore?: number;
  tiers?: Tier[];
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'ev-1788282900255',
    name: 'ASD',
    date: '2222-02-22',
    venue: '222',
    city: 'Buenos Aires',
    demandScore: 98,
    imageUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    slug: 'asd',
    description: 'Apertura de temporada exclusiva con acústica de precisión y montaje lumínico envolvente.',
    tiers: [
      { name: 'Early Bird', price: 12000, capacity: 100, soldCount: 2 },
      { name: 'General T1', price: 15000, capacity: 250, soldCount: 0 },
    ],
  },
  {
    id: 'ev-default-sunset',
    name: 'OASIS Sunset Edition',
    date: '15 de Octubre, 2026',
    venue: 'PMRC Puerto Madero',
    city: 'Buenos Aires',
    genre: 'Melodic Techno',
    demandScore: 94,
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    slug: 'oasis-sunset',
    description: 'Atardecer frente al río, sonido envolvente de alta definición y barra express sin filas.',
    tiers: [
      { name: 'Early Bird', price: 12000, capacity: 150, soldCount: 150 },
      { name: 'General T1', price: 15000, capacity: 400, soldCount: 120 },
    ],
  },
];

const CITIES = ['Todas', 'Buenos Aires', 'Puerto Madryn', 'Córdoba'];

const PAYMENT_METHODS = [
  { id: 'mp', name: 'Mercado Pago', icon: '💙' },
  { id: 'card', name: 'Tarjeta de Débito / Crédito', icon: '💳' },
  { id: 'transfer', name: 'Transferencia Bancaria / MODO', icon: '⚡' },
];

function getActiveUser() {
  if (typeof window === 'undefined') return null;
  const rawSession =
    localStorage.getItem('oasis_current_session') || localStorage.getItem('oasis_customer_user');
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession);
      if (parsed && (parsed.email || parsed.name)) {
        return {
          name: parsed.name || 'Usuario',
          email: (parsed.email || '').toLowerCase().trim(),
          dni: parsed.dni || 'Sin DNI',
        };
      }
    } catch {}
  }
  return null;
}

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [selectedCity, setSelectedCity] = useState<string>('Todas');
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPayment, setSelectedPayment] = useState<string>('mp');
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('oasis_local_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
        } else {
          setEvents(DEFAULT_EVENTS);
        }
      } else {
        setEvents(DEFAULT_EVENTS);
      }
    } catch {
      setEvents(DEFAULT_EVENTS);
    }
  }, []);

  // Lista ordenada para el carrusel
  const featuredEvents = [...events].sort(
    (a, b) => (b.demandScore || 90) - (a.demandScore || 90)
  );

  // Auto-rotación del carrusel cada 5 segundos
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCarouselIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  const currentFeatured = featuredEvents[activeCarouselIndex] || featuredEvents[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredEvents =
    selectedCity === 'Todas'
      ? events
      : events.filter(
          (ev) => (ev.city || 'Buenos Aires').toLowerCase() === selectedCity.toLowerCase()
        );

  const handleOpenEvent = (event: EventItem) => {
    setSelectedEvent(event);
    setSelectedTierIndex(0);
    setQuantity(1);
    setPurchaseSuccess(false);
  };

  const currentTier = selectedEvent?.tiers?.[selectedTierIndex] || {
    name: 'General',
    price: 15000,
    capacity: 500,
    soldCount: 0,
  };
  const subtotal = currentTier.price * quantity;
  const serviceCharge = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + serviceCharge;

  const handleConfirmPurchase = () => {
    if (!selectedEvent) return;

    const activeUser = getActiveUser();
    if (!activeUser || !activeUser.email) {
      alert('Por favor iniciá sesión en el menú superior para comprar tus entradas.');
      return;
    }

    setIsBuying(true);

    setTimeout(() => {
      try {
        const storedIssued = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');

        const newTickets = Array.from({ length: quantity }).map(() => {
          const randHex = Math.random().toString(16).substring(2, 10).toUpperCase();
          const tokenSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();

          return {
            id: `tkt-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
            eventId: selectedEvent.id,
            eventName: selectedEvent.name,
            tierName: currentTier.name,
            date: selectedEvent.date,
            venue: selectedEvent.venue,
            holderName: activeUser.name,
            holderDni: activeUser.dni,
            holderEmail: activeUser.email,
            qrToken: `OASIS-${randHex}-${tokenSuffix}`,
            status: 'VALID',
            entryCutoffTime: '',
            purchaseDate: new Date().toISOString(),
            price: currentTier.price,
            paymentMethod: selectedPayment,
          };
        });

        localStorage.setItem(
          'oasis_issued_tickets',
          JSON.stringify([...storedIssued, ...newTickets])
        );
        setIsBuying(false);
        setPurchaseSuccess(true);
      } catch (err) {
        console.error(err);
        setIsBuying(false);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-[#0f131c]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xs tracking-tighter shadow-lg shadow-blue-600/30 group-hover:scale-95 transition-transform">
              O
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-white leading-none">
                OASIS
              </span>
              <span className="text-[9px] text-blue-400 font-mono tracking-wider mt-0.5">
                LIVE EXPERIENCES
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/bar"
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-amber-500/10"
            >
              <span>🍸</span>
              <span>Barra</span>
            </Link>
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#161a26] hover:border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Panel Productora</span>
            </Link>
            <div className="pl-1.5 border-l border-slate-800">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-12 flex-1">
        {/* HERO CARRUSEL ACTIVO */}
        {currentFeatured && (
          <section className="relative">
            <div className="flex items-center justify-between font-mono text-xs mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Evento Destacado · En Cartelera</span>
              </div>
              <div className="flex gap-1.5">
                {featuredEvents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCarouselIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      activeCarouselIndex === idx ? 'w-6 bg-blue-500' : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div
              onClick={() => handleOpenEvent(currentFeatured)}
              className="group relative block w-full aspect-[21/9] min-h-[300px] rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl transition-all duration-300 hover:border-slate-600 cursor-pointer"
            >
              <img
                src={currentFeatured.imageUrl}
                alt={currentFeatured.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/40 to-transparent" />

              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 flex flex-col justify-end space-y-3">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="px-3 py-1 rounded-full bg-black/80 text-white border border-white/10 font-bold uppercase">
                    📍 {currentFeatured.venue}
                  </span>
                  {currentFeatured.city && (
                    <span className="px-3 py-1 rounded-full bg-black/80 text-white border border-white/10 font-bold uppercase">
                      {currentFeatured.city}
                    </span>
                  )}
                  {currentFeatured.genre && (
                    <span className="px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30 font-bold uppercase">
                      {currentFeatured.genre}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-blue-400 font-bold block">
                    📅 {currentFeatured.date}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">
                    {currentFeatured.name}
                  </h2>
                </div>

                <div className="pt-2 flex items-center justify-between font-mono">
                  <span className="text-xs text-slate-300">
                    Desde ${(currentFeatured.tiers?.[0]?.price || 12000).toLocaleString('es-AR')}
                  </span>
                  <span className="px-5 py-2.5 bg-blue-600 group-hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-blue-600/30">
                    Ver Información →
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FILTRO DE CIUDADES */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white">
                Cartelera Oficial
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Tocá cualquier tarjeta para abrir su descripción completa y pases.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-3.5 py-1.5 rounded-xl border transition-all ${
                    selectedCity === c
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold shadow-md shadow-blue-500/10'
                      : 'bg-[#131722] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* GRILLA DE EVENTOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleOpenEvent(event)}
                className="group relative flex flex-col bg-[#131722] border border-slate-800/80 hover:border-blue-500/60 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-950/30 cursor-pointer select-none"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-transparent to-black/20" />

                  <div className="absolute top-3 left-3 flex gap-2 font-mono text-[10px]">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/10 font-bold uppercase">
                      📍 {event.venue}
                    </span>
                    {event.genre && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30 backdrop-blur-md font-bold uppercase">
                        {event.genre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-blue-400 font-bold block">
                      📅 {event.date}
                    </span>
                    <h3 className="text-lg font-black uppercase text-white tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed">
                      {event.description || 'Pases nominados con acreditación inmediata.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Desde</span>
                      <span className="text-sm font-black text-white">
                        ${(event.tiers?.[0]?.price || 12000).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <span className="px-4 py-2 bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-1">
                      <span>Ver Info</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL CON CIERRE POR CLIC AFUERA */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-[#10141e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto cursor-default animate-fade-in"
          >
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/10 font-mono transition"
            >
              ✕
            </button>

            {purchaseSuccess ? (
              <div className="p-8 sm:p-12 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
                  ✅
                </div>
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Operación Confirmada
                  </span>
                  <h3 className="text-2xl font-black uppercase text-white">
                    ¡Pases Emitidos con Éxito!
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Tus entradas para {selectedEvent.name} ya están cargadas en tu cuenta.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 font-mono">
                  <Link
                    href="/my-tickets"
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-blue-600/30"
                  >
                    Ver Mis Entradas →
                  </Link>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-6 py-3.5 border border-slate-800 bg-[#161a26] text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-6 p-6 sm:p-8 space-y-6 border-b md:border-b-0 md:border-r border-slate-800">
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-800">
                    <img
                      src={selectedEvent.imageUrl}
                      alt={selectedEvent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-mono text-blue-400 font-bold block">
                      📅 {selectedEvent.date} · {selectedEvent.venue}
                    </span>
                    <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                      {selectedEvent.name}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                      {selectedEvent.description || 'Pases oficiales con validación digital.'}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-6 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider block">
                      Seleccionar Tanda
                    </span>

                    <div className="space-y-2 font-mono">
                      {(selectedEvent.tiers || []).map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTierIndex(idx)}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                            selectedTierIndex === idx
                              ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                              : 'bg-[#161a26] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold text-white uppercase">{t.name}</span>
                          <span className="text-xs font-black text-blue-400">
                            ${t.price.toLocaleString('es-AR')}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between font-mono border-y border-slate-800 py-3 text-xs">
                      <span className="text-slate-300 font-bold uppercase">Cantidad:</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-7 h-7 rounded-lg border border-slate-800 bg-[#161a26] hover:bg-[#202738] text-white font-bold"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-white w-4 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(6, quantity + 1))}
                          className="w-7 h-7 rounded-lg border border-slate-800 bg-[#161a26] hover:bg-[#202738] text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Medio de Pago
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedPayment(m.id)}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                              selectedPayment === m.id
                                ? 'bg-blue-600/15 border-blue-500 text-white'
                                : 'bg-[#161a26] border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="text-base">{m.icon}</span>
                            <span className="text-[9px] font-bold uppercase">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total a Pagar:</span>
                      <span className="text-sm font-black text-emerald-400">
                        ${totalAmount.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <button
                      onClick={handleConfirmPurchase}
                      disabled={isBuying}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-blue-600/30"
                    >
                      {isBuying ? 'Procesando...' : `Confirmar Pases · $${totalAmount.toLocaleString('es-AR')} →`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0c0f16] py-6 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>OASIS LIVE PLATFORM · Experiencias y Pases Digitales</span>
        </div>
      </footer>
    </div>
  );
}