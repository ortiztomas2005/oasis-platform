'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HoloTicket from '@/components/HoloTicket';
import ResaleModal from '@/components/ResaleModal';

interface TicketData {
  id: string;
  holder_name: string;
  holder_dni: string;
  holder_email: string;
  tier_name: string;
  qr_hash: string;
  status: string;
  purchase_price: number;
  events: {
    name: string;
    date: string;
    venue: string;
    description: string;
    slug: string;
  };
}

export default function MyTicketsPage() {
  const [identifier, setIdentifier] = useState('');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cargar búsqueda previa del dispositivo
  useEffect(() => {
    const saved = localStorage.getItem('oasis_user_identifier');
    if (saved) {
      setIdentifier(saved);
      fetchTickets(saved);
    }
  }, []);

  const fetchTickets = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/tickets/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: query.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
        localStorage.setItem('oasis_user_identifier', query.trim());
      } else {
        alert(data.error || 'Error al buscar pases');
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets(identifier);
  };

  const handleClearSession = () => {
    localStorage.removeItem('oasis_user_identifier');
    setIdentifier('');
    setTickets([]);
    setHasSearched(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-5">
          <div>
            <Link href="/" className="text-xl font-black tracking-widest text-yellow-400">
              • OASIS.
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black uppercase mt-1 tracking-tight">
              Mis Entradas & Pases
            </h1>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Portal de acceso rápido a tus códigos QR y gestión de tickets oficiales.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 hover:text-white hover:border-neutral-700 transition-all"
          >
            ← Cartelera
          </Link>
        </div>

        {/* Buscador de Entradas */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 mb-8 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                required
                placeholder="Ingresá tu DNI o Email..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-black/60 border border-neutral-700 rounded-2xl px-4 py-3.5 text-sm font-mono text-white placeholder-neutral-500 focus:border-yellow-400 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase font-mono rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/10"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Buscando...
                </>
              ) : (
                'Buscar Mis Entradas'
              )}
            </button>
          </form>

          {hasSearched && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-500">
              <span>Búsqueda activa: <b className="text-neutral-300">{identifier}</b></span>
              <button
                onClick={handleClearSession}
                className="hover:text-rose-400 transition-colors underline"
              >
                Limpiar datos guardados
              </button>
            </div>
          )}
        </div>

        {/* Resultados */}
        {hasSearched && (
          <div className="space-y-10">
            {tickets.length === 0 ? (
              <div className="border border-dashed border-neutral-800 rounded-3xl p-12 text-center bg-neutral-900/20">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-base font-bold text-white mb-1">No se encontraron tickets</h3>
                <p className="text-xs font-mono text-neutral-400 max-w-sm mx-auto">
                  No hay entradas vinculadas a "<span className="text-white">{identifier}</span>". Verificá haber ingresado el mismo DNI o Email con el que compraste o te emitieron la cortesía.
                </p>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Render del Pase Holográfico */}
                    <div className="lg:col-span-5 flex justify-center">
                      <HoloTicket
                        code={t.qr_hash}
                        eventName={t.events?.name || 'Evento'}
                        category={t.tier_name || 'GENERAL'}
                        holderName={t.holder_name}
                        date={new Date(t.events?.date).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                        status={t.status}
                      />
                    </div>

                    {/* Detalle y Opciones del Pase */}
                    <div className="lg:col-span-7 space-y-4 font-mono">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold rounded-full uppercase">
                            📍 {t.events?.venue || 'Predio'}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">
                            {new Date(t.events?.date).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                          {t.events?.name}
                        </h2>
                      </div>

                      {/* Caja de Datos */}
                      <div className="bg-black/50 border border-neutral-800/80 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">TITULAR:</span>
                          <span className="font-bold text-white">{t.holder_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">DNI:</span>
                          <span className="text-neutral-300">{t.holder_dni}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">SECTOR / TANDA:</span>
                          <span className="text-yellow-400 font-bold">{t.tier_name}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                          <span className="text-neutral-500">ESTADO DEL PASE:</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                              t.status === 'VALID'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : t.status === 'USED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {t.status === 'VALID'
                              ? 'VÁLIDO PARA INGRESAR'
                              : t.status === 'USED'
                              ? 'INGRESADO'
                              : 'PUBLICADO EN REVENTA'}
                          </span>
                        </div>
                      </div>

                      {/* Acciones del Ticket */}
                      <div className="pt-2 space-y-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/ticket/${t.qr_hash}`}
                            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>📱</span> Ver en Pantalla Completa
                          </Link>
                          {t.events?.slug && (
                            <Link
                              href={`/events/${t.events.slug}`}
                              className="px-4 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold text-center transition-all"
                            >
                              Info Evento
                            </Link>
                          )}
                        </div>

                        {/* Módulo de Reventa si el ticket está válido */}
                        {t.status === 'VALID' && (
                          <div className="pt-2 border-t border-neutral-800/80">
                            <ResaleModal
                              ticketId={t.id}
                              originalPrice={t.purchase_price}
                              onSuccess={() => fetchTickets(identifier)}
                            />
                          </div>
                        )}

                        {t.status === 'FROZEN_RESALE' && (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                            <p className="text-xs text-yellow-400 font-mono">
                              ⚠️ Ticket publicado en el Marketplace Oficial. Tu QR está pausado hasta que se venda o canceles la publicación.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}