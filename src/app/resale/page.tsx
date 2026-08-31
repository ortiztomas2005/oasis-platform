'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResalePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Compra
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [buying, setBuying] = useState(false);
  const [successTicket, setSuccessTicket] = useState<any>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resale');
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyResale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !buyerName || !buyerEmail || !buyerDni) return;

    try {
      setBuying(true);
      const res = await fetch('/api/resale/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing.id,
          buyerName,
          buyerEmail,
          buyerDni,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessTicket(data);
        fetchListings();
      } else {
        alert(data.error || 'Error al comprar reventa');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBuying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050811] text-white font-sans antialiased">
      {/* NAVBAR */}
      <header className="border-b border-blue-950/60 bg-[#050811]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-oasis.png" alt="OASIS" className="h-10 w-auto invert brightness-200 object-contain" />
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/my-tickets"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              Publicar mi Entrada (Mis Entradas)
            </Link>
            <Link href="/admin" className="px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-300">
              Backstage
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-mono">
        {/* CABECERA SIMPLE */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-blue-950/60 pb-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest block">Mercado Oficial</span>
            <h1 className="text-3xl font-black uppercase text-white">Sitio de Reventa</h1>
          </div>
          <span className="text-xs text-neutral-400 font-bold">
            {listings.length} {listings.length === 1 ? 'entrada disponible' : 'entradas disponibles'}
          </span>
        </div>

        {/* LISTADO DE ENTRADAS EN REVENTA */}
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-500">Cargando publicaciones...</div>
        ) : listings.length === 0 ? (
          <div className="border border-dashed border-blue-950 rounded-3xl p-16 text-center space-y-4">
            <p className="text-neutral-400 text-xs">No hay entradas publicadas para reventa en este momento.</p>
            <p className="text-neutral-600 text-[11px]">
              Si ya tenés una entrada y querés venderla, ingresá a <Link href="/my-tickets" className="text-blue-400 underline">Mis Entradas</Link> y tocala para publicarla.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-[#0A0F1D] border border-blue-950 hover:border-blue-700/60 rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="bg-blue-600 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                      {item.tier_name || 'GENERAL'}
                    </span>
                    <span className="text-xs font-black text-white">
                      ${Number(item.price).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <h3 className="font-black text-lg uppercase text-white">{item.events?.name || 'Evento OASIS'}</h3>
                  <p className="text-xs text-neutral-400">📍 {item.events?.venue || 'Buenos Aires'}</p>
                </div>

                <button
                  onClick={() => setSelectedListing(item)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl transition-all"
                >
                  Comprar Entrada →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE COMPRA */}
      {selectedListing && !successTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0F1D] border border-blue-950 rounded-3xl max-w-md w-full p-6 space-y-4 font-mono">
            <div className="flex justify-between items-start border-b border-blue-950 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400">Confirmar Compra</span>
                <h3 className="text-lg font-black uppercase text-white">{selectedListing.events?.name}</h3>
              </div>
              <button onClick={() => setSelectedListing(null)} className="text-neutral-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleBuyResale} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Tu Nombre"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-black/60 border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">DNI</label>
                <input
                  type="text"
                  required
                  placeholder="Tu DNI"
                  value={buyerDni}
                  onChange={(e) => setBuyerDni(e.target.value)}
                  className="w-full bg-black/60 border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Tu Email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-black/60 border border-blue-950 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-blue-950 flex justify-between items-center">
                <span className="text-xs text-neutral-400">Total:</span>
                <span className="text-base font-black text-white">${Number(selectedListing.price).toLocaleString('es-AR')}</span>
              </div>

              <button
                type="submit"
                disabled={buying}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl disabled:opacity-50"
              >
                {buying ? 'Procesando...' : 'Comprar Entrada'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO */}
      {successTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0F1D] border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-4 font-mono">
            <span className="text-3xl">🎉</span>
            <h3 className="text-xl font-black uppercase text-white">¡Compra Exitosa!</h3>
            <p className="text-xs text-neutral-300">
              La entrada ya está a tu nombre. Podés verla y usarla desde Mis Entradas.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link href="/my-tickets" className="px-5 py-2.5 bg-blue-600 text-white font-bold uppercase text-xs rounded-xl">
                Ir a Mis Entradas
              </Link>
              <button
                onClick={() => { setSelectedListing(null); setSuccessTicket(null); }}
                className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-white font-bold uppercase text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}