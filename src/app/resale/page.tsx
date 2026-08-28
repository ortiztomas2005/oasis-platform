'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResaleMarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Publicar Entrada
  const [isPublishing, setIsPublishing] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [price, setPrice] = useState('');
  const [publishingLoading, setPublishingLoading] = useState(false);

  // Modal Comprar Reventa
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [buyingLoading, setBuyingLoading] = useState(false);
  const [successTicket, setSuccessTicket] = useState<any | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resale');
      const data = await res.json();
      if (res.ok) {
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingLoading(true);

    try {
      const res = await fetch('/api/resale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode, dni, email, price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar entrada');

      alert('¡Entrada puesta a la venta en el Marketplace Oficial!');
      setIsPublishing(false);
      setAuthCode('');
      setDni('');
      setEmail('');
      setPrice('');
      fetchListings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPublishingLoading(false);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setBuyingLoading(true);

    try {
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
      if (!res.ok) throw new Error(data.error || 'Error al comprar reventa');

      setSuccessTicket(data);
      setSelectedListing(null);
      fetchListings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBuyingLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-yellow-400 selection:text-black">
      {/* HEADER */}
      <header className="border-b border-neutral-900 bg-black/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-black text-sm tracking-wider text-yellow-400">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            OASIS • REVENTA OFICIAL P2P
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPublishing(true)}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-xs uppercase rounded-xl transition-all"
            >
              + Vender mi Entrada
            </button>
            <Link href="/my-tickets" className="font-mono text-xs text-neutral-400 hover:text-white uppercase font-bold">
              Mis Entradas ↗
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        
        {/* MODAL: PUBLICAR TICKET */}
        {isPublishing && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="font-black text-base uppercase text-white font-mono">Publicar Entrada en Reventa</h3>
                <button onClick={() => setIsPublishing(false)} className="text-neutral-400 hover:text-white font-mono text-sm">✕</button>
              </div>

              <form onSubmit={handlePublish} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Código Hash / Auth del Ticket *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: OASIS-TR-XXXXX"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">DNI Titular *</label>
                    <input
                      type="text"
                      required
                      placeholder="42123456"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Precio Reventa ($) *</label>
                    <input
                      type="number"
                      required
                      placeholder="15000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-yellow-400 font-bold outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Email del Titular *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-[10px] text-yellow-300">
                  ⚠️ Al venderse tu entrada, tu código QR actual quedará automáticamente invalidado (quemado).
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublishing(false)}
                    className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl uppercase font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={publishingLoading}
                    className="px-5 py-2 bg-yellow-400 text-black font-black uppercase rounded-xl transition-all"
                  >
                    {publishingLoading ? 'Verificando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: COMPRAR ENTRADA DE REVENTA */}
        {selectedListing && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="font-black text-base uppercase text-white font-mono">Comprar Entrada Reventa</h3>
                <button onClick={() => setSelectedListing(null)} className="text-neutral-400 hover:text-white font-mono text-sm">✕</button>
              </div>

              <div className="bg-black/60 border border-neutral-800 p-4 rounded-2xl font-mono text-xs space-y-1">
                <p className="font-bold text-white uppercase text-sm">{selectedListing.events?.name || selectedListing.events?.title}</p>
                <p className="text-yellow-400 font-bold uppercase">{selectedListing.tier_name}</p>
                <p className="text-neutral-400">Total: <strong className="text-white text-sm">${Number(selectedListing.price).toLocaleString('es-AR')}</strong></p>
              </div>

              <form onSubmit={handleBuy} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Nombre Completo del Nuevo Titular *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Micaela Gómez"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">DNI / Documento *</label>
                    <input
                      type="text"
                      required
                      placeholder="40123456"
                      value={buyerDni}
                      onChange={(e) => setBuyerDni(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Email de Entrega *</label>
                    <input
                      type="email"
                      required
                      placeholder="mica@gmail.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedListing(null)}
                    className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl uppercase font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={buyingLoading}
                    className="px-5 py-2 bg-yellow-400 text-black font-black uppercase rounded-xl transition-all"
                  >
                    {buyingLoading ? 'Regenerando QR...' : `Confirmar ($${Number(selectedListing.price).toLocaleString('es-AR')})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: COMPRA EXITOSA */}
        {successTicket && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center font-mono">
              <div className="w-12 h-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                ✓
              </div>
              <h3 className="text-lg font-black uppercase text-white">¡Entrada Reemitida!</h3>
              <p className="text-xs text-neutral-400">
                El pase anterior fue destruido y tenés asignado un nuevo QR intransferible a tu nombre.
              </p>
              <div className="bg-black/60 border border-neutral-800 p-3 rounded-xl text-left text-xs space-y-1">
                <p className="text-neutral-500">Nuevo Código: <strong className="text-yellow-400">{successTicket.authCode}</strong></p>
              </div>
              <Link
                href="/my-tickets"
                className="block w-full py-2.5 bg-yellow-400 text-black font-black uppercase rounded-xl text-xs"
              >
                Ver Mi Entrada
              </Link>
            </div>
          </div>
        )}

        {/* BANNER REVENTA SEGURA */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-black border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1 font-mono">
            <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-widest">
              Garantía Oficial Anti-Fraude
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
              Mercado Secundario 100% Verificado
            </h2>
            <p className="text-xs text-neutral-400 max-w-xl">
              Comprá y vendé sin intermediarios truchos. Al concretar la operación, el QR anterior se quema automáticamente en la base de datos y se emite una credencial nueva.
            </p>
          </div>
        </div>

        {/* LISTADO DE TICKETS EN REVENTA */}
        <div className="space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase font-bold text-yellow-400 tracking-wider">
              Entradas Disponibles en Reventa ({listings.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-500">Cargando marketplace de reventa...</div>
          ) : listings.length === 0 ? (
            <div className="border border-dashed border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 text-xs">
              No hay entradas publicadas para reventa en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((item) => (
                <div key={item.id} className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-5 space-y-4 hover:border-neutral-700 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {item.tier_name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    <h4 className="font-bold text-white uppercase text-base tracking-tight">
                      {item.events?.name || item.events?.title || 'Fiesta Oficial'}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      📍 {item.events?.venue || 'Ubicación Central'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Precio</span>
                      <span className="text-lg font-black text-yellow-400">${Number(item.price).toLocaleString('es-AR')}</span>
                    </div>

                    <button
                      onClick={() => setSelectedListing(item)}
                      className="px-4 py-2 bg-white hover:bg-yellow-400 hover:text-black text-black font-black uppercase text-xs rounded-xl transition-all"
                    >
                      Comprar Pase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}