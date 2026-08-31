'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050811] text-white selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-hidden">
      
      {/* NAVBAR */}
      <header className="border-b border-blue-950/60 bg-[#050811]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-oasis.png"
              alt="OASIS"
              className="h-10 w-auto invert brightness-200 object-contain"
            />
          </Link>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/resale"
              className="px-3.5 py-2 rounded-xl border border-blue-900/40 bg-blue-950/20 text-neutral-300 hover:text-white transition-all"
            >
              Reventa Oficial
            </Link>
            <Link
              href="/my-tickets"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Mis Entradas
            </Link>
            <Link
              href="/admin"
              className="px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white transition-all"
            >
              Backstage
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-16 sm:pt-20 pb-10 text-center space-y-6">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
            EXPERIENCIAS
          </h1>
          <img
            src="/logo-oasis.png"
            alt="OASIS"
            className="h-14 sm:h-20 w-auto invert brightness-200 object-contain"
          />
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-3 font-mono text-xs">
          <a
            href="#events-list"
            className="px-6 py-3 bg-white text-black font-black uppercase rounded-xl hover:bg-neutral-200 transition-all shadow-lg"
          >
            Explorar Fechas ↓
          </a>
          <Link
            href="/resale"
            className="px-6 py-3 bg-blue-950/40 border border-blue-900/50 text-neutral-200 hover:text-white font-bold uppercase rounded-xl hover:border-blue-500 transition-all"
          >
            Reventa Oficial
          </Link>
        </div>
      </section>

      {/* LISTADO DE EVENTOS */}
      <section id="events-list" className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between border-b border-blue-950/60 pb-4 font-mono">
          <span className="text-xs uppercase font-bold text-blue-400 tracking-widest">Cartelera Oficial</span>
          <span className="text-xs text-neutral-400 font-bold">{events.length} eventos</span>
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-neutral-500">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-blue-950/60 rounded-3xl p-16 text-center font-mono text-xs text-neutral-500">
            No hay eventos publicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="group bg-[#0A0F1D] border border-blue-950 hover:border-blue-700/60 rounded-3xl overflow-hidden transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={evt.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop'}
                    alt={evt.name || evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-xl font-mono text-[10px] font-bold text-white uppercase">
                    📅 {evt.date ? new Date(evt.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : 'Próximamente'}
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-lg uppercase text-white group-hover:text-blue-400 transition-colors">
                      {evt.name || evt.title}
                    </h3>
                    <p className="text-xs font-mono text-neutral-400 mt-1">
                      📍 {evt.venue || evt.venue_name || 'Buenos Aires'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-blue-950/60 flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-blue-400">Pase Oficial</span>
                    <Link
                      href={`/events/${evt.slug || evt.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl transition-all"
                    >
                      Comprar Pase →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-blue-950/60 mt-16 py-8 font-mono text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex justify-between items-center">
          <span>OASIS TICKETING © 2026</span>
          <div className="flex gap-4 text-neutral-400">
            <Link href="/resale" className="hover:text-white">Reventa</Link>
            <Link href="/my-tickets" className="hover:text-white">Mis Entradas</Link>
            <Link href="/admin" className="hover:text-blue-400">Backstage</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}