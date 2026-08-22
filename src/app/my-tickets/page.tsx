'use client';

import { useState } from 'react';
import Link from 'next/link';
import HoloTicket from '@/components/HoloTicket';
import ResaleModal from '@/components/ResaleModal';

export default function MyTicketsPage() {
  const [identifier, setIdentifier] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/tickets/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      } else {
        alert(data.error || 'Error al buscar tickets');
      }
    } catch (err: any) {
      alert('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera */}
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
          <div>
            <Link href="/" className="text-xl font-black tracking-widest text-yellow-400">
              • OASIS.
            </Link>
            <h1 className="text-2xl md:text-3xl font-black uppercase mt-1 tracking-tight">Mis Entradas</h1>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Consultá tus accesos oficiales y gestioná tu pase o reventa en un solo lugar.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono hover:bg-neutral-800 transition-all"
          >
            ← Cartelera
          </Link>
        </div>

        {/* Buscador de Entradas */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-10 shadow-2xl">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Ingresá tu DNI o tu Email..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="flex-1 bg-black/60 border border-neutral-700 rounded-2xl px-4 py-3 text-sm font-mono text-white focus:border-yellow-400 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase font-mono rounded-2xl transition-all disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar Mis Pases'}
            </button>
          </form>
        </div>

        {/* Resultados */}
        {hasSearched && (
          <div className="space-y-12">
            {tickets.length === 0 ? (
              <div className="border border-dashed border-neutral-800 rounded-3xl p-12 text-center">
                <p className="text-sm font-mono text-neutral-400">
                  No se encontraron tickets asociados a "<span className="text-white">{identifier}</span>".
                </p>
                <p className="text-xs text-neutral-500 font-mono mt-1">
                  Revisá haber escrito bien tu DNI o el correo electrónico con el que realizaste la compra.
                </p>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 md:p-8 backdrop-blur-md"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    
                    {/* Tarjeta Holográfica del Pase */}
                    <div className="flex flex-col items-center">
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

                    {/* Información del Evento & Acciones */}
                    <div className="space-y-5 font-mono">
                      <div>
                        <span className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold rounded-full uppercase tracking-wider">
                          {t.events?.venue || 'Ubicación a confirmar'}
                        </span>
                        <h2 className="text-2xl font-black text-white mt-3 uppercase tracking-tight">
                          {t.events?.name}
                        </h2>
                        <p className="text-xs text-neutral-400 mt-2 line-clamp-3">
                          {t.events?.description || 'Presentá este código QR en el acceso del predio junto con tu documento de identidad.'}
                        </p>
                      </div>

                      <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">TITULAR:</span>
                          <span className="font-bold text-white">{t.holder_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">DNI:</span>
                          <span className="text-neutral-300">{t.holder_dni}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">ESTADO:</span>
                          <span className={t.status === 'VALID' ? 'text-blue-400 font-bold' : t.status === 'USED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {t.status === 'VALID' ? 'ACTIVO (LISTO PARA INGRESAR)' : t.status === 'USED' ? 'INGRESADO' : 'PUBLICADO EN REVENTA'}
                          </span>
                        </div>
                      </div>

                      {/* Botón de Reventa Oficial */}
                      {t.status === 'VALID' && (
                        <div className="pt-2">
                          <ResaleModal
                            ticketId={t.id}
                            originalPrice={t.purchase_price}
                            onSuccess={() => handleSearch(new Event('submit') as any)}
                          />
                          <p className="text-[10px] text-neutral-500 text-center mt-2">
                            ¿No vas a poder asistir? Publicalo al instante en el Marketplace seguro.
                          </p>
                        </div>
                      )}

                      {t.status === 'FROZEN_RESALE' && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-center">
                          <span className="text-xs text-yellow-400 font-mono">
                            ⚠️ Ticket publicado en Reventa Oficial. Si alguien lo compra, tu dinero se liquidará automáticamente.
                          </span>
                        </div>
                      )}
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