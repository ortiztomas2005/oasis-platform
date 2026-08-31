'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MyTicketsPage() {
  const [identifier, setIdentifier] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    try {
      setLoading(true);
      setSearched(true);
      const res = await fetch(`/api/tickets/my?q=${encodeURIComponent(identifier.trim())}`);
      if (!res.ok) {
        setTickets([]);
        return;
      }
      const data = await res.json().catch(() => ({ tickets: [] }));
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResale = async (ticket: any) => {
    try {
      setPublishingId(ticket.id);
      const res = await fetch('/api/resale/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          eventId: ticket.event_id,
          tierName: ticket.tier_name,
          price: ticket.price_paid || 15000,
          sellerEmail: ticket.customer_email || ticket.holder_email,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        alert('¡Entrada publicada con éxito en el Sitio de Reventa!');
        handleSearch({ preventDefault: () => {} } as any);
      } else {
        alert(data.error || 'Error al publicar en reventa');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#050811] text-white font-sans antialiased">
      {/* NAVBAR */}
      <header className="border-b border-blue-950/60 bg-[#050811]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-oasis.png" alt="OASIS" className="h-10 w-auto invert brightness-200 object-contain" />
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link href="/resale" className="px-3.5 py-2 rounded-xl border border-blue-900/40 bg-blue-950/20 text-neutral-300 hover:text-white transition-all">
              Sitio de Reventa
            </Link>
            <Link href="/" className="text-neutral-400 hover:text-white">← Inicio</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-mono">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Billetera Nominal</span>
          <h1 className="text-3xl font-black uppercase text-white">Mis Entradas</h1>
          <p className="text-xs text-neutral-400">Ingresá tu DNI o el Email con el que compraste para ver tu credencial.</p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto pt-4">
            <input
              type="text"
              required
              placeholder="DNI o Email..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#0A0F1D] border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 uppercase"
            />
            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </form>
        </div>

        {searched && (
          <div className="space-y-6">
            {tickets.length === 0 ? (
              <div className="border border-dashed border-blue-950 rounded-3xl p-12 text-center text-xs text-neutral-500">
                No encontramos entradas activas asociadas a "{identifier}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map((t) => {
                  const isAvailable = t.status === 'AVAILABLE' || t.status === 'VALID';
                  const isUsed = t.status === 'USED';
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(t.auth_code || t.qr_hash || t.id)}`;

                  return (
                    <div key={t.id} className="bg-[#0A0F1D] border border-blue-950 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl">
                      <div className="p-6 bg-blue-950/20 border-b border-blue-950 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="bg-blue-600 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                            {t.tier_name || 'GENERAL'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : isUsed ? 'bg-neutral-800 text-neutral-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isAvailable ? '● HABILITADO' : isUsed ? '✓ INGRESADO' : '✕ ANULADO'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black uppercase text-white">{t.events?.name || 'Evento OASIS'}</h3>
                        <p className="text-xs text-neutral-400">📍 {t.events?.venue || 'Buenos Aires'}</p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="bg-white rounded-2xl p-4 w-44 h-44 mx-auto flex items-center justify-center">
                          <img src={qrUrl} alt="QR Pase" className="w-full h-full object-contain" />
                        </div>

                        <div className="bg-black/60 border border-blue-950 p-3 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Titular:</span>
                            <span className="font-bold uppercase text-white">{t.customer_name || t.holder_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">DNI:</span>
                            <span className="font-bold text-blue-400">{t.customer_dni || t.holder_dni || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Hash:</span>
                            <span className="text-neutral-400 text-[10px]">{t.auth_code || t.qr_hash}</span>
                          </div>
                        </div>

                        {isAvailable && (
                          <button
                            onClick={() => handlePublishResale(t)}
                            disabled={publishingId === t.id}
                            className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-white font-bold text-xs uppercase rounded-xl transition-all"
                          >
                            {publishingId === t.id ? 'Publicando...' : 'Publicar en Reventa Oficial ↗'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}