'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  demandScore?: number;
  tiers?: Tier[];
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    name: 'OASIS Sunset Edition',
    date: 'Sáb 15 Oct · 18:00 HS',
    venue: 'PMRC Club · Puerto Madero',
    city: 'Buenos Aires',
    genre: 'Melodic Techno',
    demandScore: 98,
    imageUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    slug: 'oasis-sunset',
    description:
      'Apertura de temporada exclusiva frente al dique. Acústica de precisión, puesta de luces volumétrica, sector backstage y consumo en barra por QR sin filas.',
    tiers: [
      { name: 'Early Bird', price: 12000, capacity: 150, soldCount: 150 },
      { name: 'General T1', price: 15000, capacity: 500, soldCount: 420 },
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
    demandScore: 89,
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    slug: 'neo-warehouse',
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
    demandScore: 94,
    imageUrl:
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200&auto=format&fit=crop',
    slug: 'patagonia-bass',
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
    demandScore: 76,
    imageUrl:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
    slug: 'sideral-open-air',
    description:
      'Apertura al aire libre con visuales panorámicas y sonido de alta fidelidad.',
    tiers: [
      { name: 'Early Bird', price: 13000, capacity: 200, soldCount: 95 },
      { name: 'General', price: 16500, capacity: 600, soldCount: 110 },
    ],
  },
];

const CITIES = ['Todas', 'Buenos Aires', 'Puerto Madryn', 'Córdoba'];

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [selectedCity, setSelectedCity] = useState<string>('Todas');
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('oasis_local_events');
      if (stored) {
        setEvents(JSON.parse(stored));
      } else {
        localStorage.setItem('oasis_local_events', JSON.stringify(INITIAL_EVENTS));
      }
    } catch {
      setEvents(INITIAL_EVENTS);
    }
  }, []);

  const featuredEvents = [...events].sort(
    (a, b) => (b.demandScore || 0) - (a.demandScore || 0)
  );

  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCarouselIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  const currentFeatured = featuredEvents[activeCarouselIndex] || featuredEvents[0];

  const filteredEvents =
    selectedCity === 'Todas'
      ? events
      : events.filter((ev) => ev.city.toLowerCase() === selectedCity.toLowerCase());

  const goToEvent = (event: EventItem) => {
    const target = event.slug || event.id;
    router.push(`/events/${target}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-[#0f131c]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
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

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-12 flex-1">
        {/* CARRUSEL DESTACADO - CLICKEABLE CON ROUTER */}
        {currentFeatured && (
          <section className="relative">
            <div className="flex items-center justify-between font-mono text-xs mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>En Alta Demanda · Ranking #1</span>
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
              onClick={() => goToEvent(currentFeatured)}
              role="button"
              tabIndex={0}
              className="group relative block w-full aspect-[21/9] min-h-[300px] rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl transition-all duration-300 hover:border-slate-600 cursor-pointer"
            >
              <img
                src={currentFeatured.imageUrl}
                alt={currentFeatured.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/40 to-transparent pointer-events-none" />

              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 flex flex-col justify-end space-y-3 pointer-events-none">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="px-3 py-1 rounded-full bg-black/80 text-white border border-white/10 font-bold uppercase">
                    📍 {currentFeatured.city}
                  </span>
                  {currentFeatured.genre && (
                    <span className="px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30 font-bold uppercase">
                      {currentFeatured.genre}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    {currentFeatured.demandScore}% Ocupación
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-blue-400 font-bold block">
                    📅 {currentFeatured.date} · {currentFeatured.venue}
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
                    Ver Evento →
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FILTRADO POR CIUDAD */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white">
                Cartelera Oficial
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Pases oficiales nominados con ingreso digital inmediato.
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

          {/* GRILLA DE EVENTOS - TOTALMENTE CLICKEABLE CON ROUTER.PUSH */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => goToEvent(event)}
                role="button"
                tabIndex={0}
                className="group relative flex flex-col bg-[#131722] border border-slate-800/80 hover:border-slate-600 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-950/30 cursor-pointer select-none"
              >
                {/* Portada */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 pointer-events-none">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-transparent to-black/20" />

                  <div className="absolute top-3 left-3 flex gap-2 font-mono text-[10px]">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/10 font-bold uppercase">
                      📍 {event.city}
                    </span>
                    {event.genre && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30 backdrop-blur-md font-bold uppercase">
                        {event.genre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Textos */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4 pointer-events-none">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-blue-400 font-bold block">
                      📅 {event.date} · {event.venue}
                    </span>
                    <h3 className="text-lg font-black uppercase text-white tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Desde</span>
                      <span className="text-sm font-black text-white">
                        ${(event.tiers?.[0]?.price || 12000).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <span className="px-4 py-2 bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-1">
                      <span>Ver Evento</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0c0f16] py-6 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>OASIS LIVE PLATFORM · Experiencias y Pases Digitales</span>
          <span className="text-[11px] text-slate-400">Buenos Aires · Puerto Madryn · Córdoba</span>
        </div>
      </footer>
    </div>
  );
} 