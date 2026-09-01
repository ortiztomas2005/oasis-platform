'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredEvents = events.filter((evt) => {
    const query = search.toLowerCase();
    const name = (evt.name || evt.title || '').toLowerCase();
    const venue = (evt.venue || evt.venue_name || '').toLowerCase();
    return name.includes(query) || venue.includes(query);
  });

  return (
    <main className="min-h-screen bg-[#050811] text-white selection:bg-blue-600 selection:text-white font-sans antialiased">
      
      {/* NAVBAR CON TODOS LOS LINKS INCLUIDO BACKSTAGE */}
      <header className="border-b border-blue-950/60 bg-[#050811]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black italic tracking-tighter text-white font-serif">OASIS</span>
            <span className="font-mono text-[10px] text-blue-400 tracking-widest uppercase font-bold border-l border-blue-900/60 pl-3">
              Eventos
            </span>
          </Link>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/resale"
              className="px-3 py-1.5 rounded-xl border border-blue-900/40 bg-blue-950/20 text-neutral-300 hover:text-white transition-all"
            >
              Reventa
            </Link>
            <Link
              href="/my-tickets"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase rounded-xl transition-all"
            >
              Mis Entradas
            </Link>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition-all"
            >
              Backstage
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-blue-950/60 pb-6">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-blue-400 tracking-widest">Cartelera Oficial</span>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Todos los Eventos</h1>
          </div>
          <input
            type="text"
            placeholder="Buscar evento o locación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 bg-[#0A0F1D] border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-neutral-500">Cargando eventos...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="border border-dashed border-blue-950 rounded-2xl p-12 text-center font-mono text-xs text-neutral-500">
            No se encontraron eventos activos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#0A0F1D] border border-blue-950 hover:border-blue-700/60 rounded-2xl overflow-hidden flex flex-col justify-between transition-all"
              >
                <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                  <img
                    src={evt.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop'}
                    alt={evt.name || evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold text-white uppercase">
                    📅 {evt.date ? new Date(evt.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : 'Próximamente'}
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-lg uppercase text-white">{evt.name || evt.title}</h3>
                    <p className="text-xs font-mono text-neutral-400">📍 {evt.venue || 'Buenos Aires'}</p>
                  </div>

                  <div className="pt-3 border-t border-blue-950/60 flex items-center justify-between font-mono">
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
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <Link href="/resale" className="hover:text-white">Reventa</Link>
            <Link href="/my-tickets" className="hover:text-white">Mis Entradas</Link>
            <Link href="/admin" className="hover:text-blue-400">Backstage</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
