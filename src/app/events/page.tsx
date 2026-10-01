'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP, ScrollTrigger } from '@/core/gsap';
import RevealText from '@/components/fx/RevealText';
import Marquee from '@/components/fx/Marquee';
import CountUp from '@/components/fx/CountUp';
import AuroraBackground from '@/components/fx/AuroraBackground';
import GlitchHeading from '@/components/fx/GlitchHeading';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events-data');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTiers(data.tiers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const query = search.toLowerCase();
    const name = (evt.name || evt.title || '').toLowerCase();
    const venue = (evt.venue || evt.venue_name || '').toLowerCase();
    return name.includes(query) || venue.includes(query);
  });

  // Las tarjetas entran con fade + slide al aparecer en viewport, no solo
  // al montar — igual criterio que en la home, importante acá porque esta
  // página puede tener muchos más eventos listados debajo del pliegue.
  useGSAP(
    () => {
      if (!gridRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gridRef.current!.querySelectorAll('.event-card');
        if (cards.length === 0) return;
        gsap.set(cards, { opacity: 0, y: 48, scale: 0.96 });
        const triggers = ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true }),
        });
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: gridRef, dependencies: [filteredEvents.length, loading] }
  );

  return (
    <main className="relative min-h-screen bg-[#05070d] text-white selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">

      {/* FONDO AURORA — mismo sistema que la home. */}
      <AuroraBackground />

      {/* NAVBAR CON TODOS LOS LINKS INCLUIDO BACKSTAGE */}
      <header className="glass relative z-50 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <GlitchHeading className="neon-text font-luxury text-base sm:text-2xl font-black tracking-tighter text-white select-none truncate">LIVE EXPERIENCE</GlitchHeading>
            <span className="hidden sm:inline-block shrink-0 font-mono text-[10px] text-blue-400 tracking-widest uppercase font-bold border-l border-blue-900/60 pl-3">
              Eventos
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-3 font-mono text-xs">
            <Link
              href="/resale"
              className="px-3 py-1.5 rounded-xl border border-blue-900/40 bg-blue-950/20 text-neutral-300 hover:text-white transition-colors duration-150 ease-out-strong active:scale-95"
            >
              Reventa
            </Link>
            <Link
              href="/my-tickets"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase rounded-xl transition-[transform,background-color] duration-150 ease-out-strong active:scale-95"
            >
              Mis Entradas
            </Link>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition-colors duration-150 ease-out-strong active:scale-95"
            >
              Backstage
            </Link>
          </div>
        </div>
      </header>

      {/* CINTA EN MOVIMIENTO */}
      <div className="glass-light relative z-10 border-b border-white/5 py-2 text-[11px] font-mono font-bold uppercase tracking-widest text-blue-300">
        <Marquee
          items={
            filteredEvents.length > 0
              ? filteredEvents.map((e) => `${e.name || e.title} — ${e.venue || 'Buenos Aires'}`)
              : ['Live Experience', 'Cartelera oficial', 'Entradas 100% verificadas']
          }
          speed={filteredEvents.length > 0 ? Math.max(22, filteredEvents.length * 6) : 28}
        />
      </div>

      {/* CONTENIDO */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-blue-950/60 pb-6">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-blue-400 tracking-widest">Cartelera Oficial</span>
            <RevealText as="h1" type="words" className="block text-3xl font-black uppercase tracking-tight text-white">
              Todos los Eventos
            </RevealText>
          </div>
          <input
            type="text"
            placeholder="Buscar evento o locación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 bg-[#0b1120] border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors duration-150 ease-out-strong font-mono"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-neutral-500">Cargando eventos...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="border border-dashed border-blue-950 rounded-2xl p-12 text-center font-mono text-xs text-neutral-500 animate-fade-in">
            No se encontraron eventos activos.
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const eventTiers = tiers.filter((t) => t.event_id === evt.id);
              const fromPrice = eventTiers.length > 0 ? Math.min(...eventTiers.map((t) => t.price)) : null;
              return (
              <div
                key={evt.id}
                className="event-card relative bg-[#0b1120] border border-blue-950 hover:border-blue-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-[transform,box-shadow,border-color] duration-300 ease-out-strong hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 group"
              >
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out-strong z-10" />

                <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                  <img
                    src={evt.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop'}
                    alt={evt.name || evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out-strong"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold text-white uppercase backdrop-blur-md">
                    📅 {evt.date ? new Date(evt.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : 'Próximamente'}
                  </div>
                  {fromPrice !== null && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-blue-500/90 text-white border border-blue-300/40 text-[10px] font-mono font-black uppercase shadow-lg shadow-blue-500/40 backdrop-blur-md">
                      Desde <CountUp value={fromPrice} prefix="$" />
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-lg uppercase text-white group-hover:text-blue-300 transition-colors duration-200 ease-out-strong">{evt.name || evt.title}</h3>
                    <p className="text-xs font-mono text-neutral-400">📍 {evt.venue || 'Buenos Aires'}</p>
                  </div>

                  <div className="pt-3 border-t border-blue-950/60 flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-blue-400">Pase Oficial</span>
                    <Link
                      href={`/events/${evt.slug || evt.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl transition-[transform,background-color,box-shadow] duration-200 ease-out-strong hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-md shadow-blue-600/20 hover:shadow-blue-500/30"
                    >
                      Comprar Pase →
                    </Link>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-blue-950/60 mt-16 py-8 font-mono text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex justify-between items-center">
          <span>LIVE EXPERIENCE TICKETING © 2026</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white transition-colors duration-150">Inicio</Link>
            <Link href="/resale" className="hover:text-white transition-colors duration-150">Reventa</Link>
            <Link href="/my-tickets" className="hover:text-white transition-colors duration-150">Mis Entradas</Link>
            <Link href="/admin" className="hover:text-blue-400 transition-colors duration-150">Backstage</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
