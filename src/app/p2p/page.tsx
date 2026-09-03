'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

export interface P2PListing {
  id: string;
  ticketId: string;
  eventName: string;
  tierName: string;
  originalPrice: number;
  sellerName: string;
  sellerAlias: string;
  price: number;
  status: 'AVAILABLE' | 'SOLD';
}

function getActiveSession() {
  if (typeof window === 'undefined') return null;
  const rawSession =
    localStorage.getItem('le_current_session') ||
    localStorage.getItem('oasis_current_session') ||
    localStorage.getItem('oasis_customer_user');
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession);
      if (parsed && (parsed.email || parsed.name)) {
        return {
          name: parsed.name || 'Usuario',
          email: (parsed.email || '').toLowerCase().trim(),
          dni: parsed.dni || '',
        };
      }
    } catch {}
  }
  return null;
}

export default function ResalePage() {
  const [listings, setListings] = useState<P2PListing[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; dni: string } | null>(null);

  // Modal de pago / contacto con el alias
  const [selectedListing, setSelectedListing] = useState<P2PListing | null>(null);
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState<boolean>(false);

  const syncListings = () => {
    const active = getActiveSession();
    setCurrentUser(active);

    try {
      const rawP2P = localStorage.getItem('le_p2p_listings');
      const allP2P = rawP2P ? JSON.parse(rawP2P) : [];
      setListings(allP2P.filter((l: any) => l.status === 'AVAILABLE'));
    } catch (e) {
      console.error(e);
      setListings([]);
    }
  };

  useEffect(() => {
    syncListings();
    window.addEventListener('storage', syncListings);
    return () => window.removeEventListener('storage', syncListings);
  }, []);

  const handleBuyListing = (listing: P2PListing) => {
    const active = getActiveSession();
    if (!active || !active.email) {
      alert('Debes iniciar sesión para adquirir una entrada en el mercado P2P.');
      return;
    }
    setSelectedListing(listing);
    setHasConfirmedTransfer(false);
  };

  const handleCompletePurchase = () => {
    if (!selectedListing || !currentUser) return;

    try {
      // 1. Marcar como vendido en el listado P2P
      const rawP2P = localStorage.getItem('le_p2p_listings');
      const allP2P = rawP2P ? JSON.parse(rawP2P) : [];
      const updatedP2P = allP2P.map((l: any) => {
        if (l.id === selectedListing.id) {
          return { ...l, status: 'SOLD' };
        }
        return l;
      });
      localStorage.setItem('le_p2p_listings', JSON.stringify(updatedP2P));

      // 2. Transferir el ticket al nuevo comprador en oasis_issued_tickets
      const rawTickets = localStorage.getItem('oasis_issued_tickets');
      const allTickets = rawTickets ? JSON.parse(rawTickets) : [];
      const updatedTickets = allTickets.map((t: any) => {
        if (t.id === selectedListing.ticketId) {
          return {
            ...t,
            holderName: currentUser.name,
            holderDni: currentUser.dni || '42190231',
            holderEmail: currentUser.email,
            status: 'VALID',
            resalePrice: undefined,
            sellerAlias: undefined,
          };
        }
        return t;
      });
      localStorage.setItem('oasis_issued_tickets', JSON.stringify(updatedTickets));

      setSelectedListing(null);
      syncListings();
      window.dispatchEvent(new Event('storage'));
      alert('¡Compra P2P completada con éxito! La entrada ya se encuentra acreditada en tu Billetera Digital.');
    } catch (err) {
      console.error(err);
      alert('Error al procesar la transferencia del ticket.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      {/* TIPOGRAFÍAS DE LUJO */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* NAVBAR */}
      <header className="border-b border-white/5 bg-[#07070a] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20">
              LE
            </div>
            <div className="flex flex-col">
              <span className="font-luxury text-lg font-black tracking-[0.1em] uppercase text-white leading-none group-hover:text-amber-400 transition">
                LIVE EXPERIENCE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition flex items-center gap-2"
            >
              <span>←</span>
              <span className="hidden sm:inline">Cartelera</span>
            </Link>
            <Link
              href="/my-tickets"
              className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-amber-300 font-bold transition flex items-center gap-2"
            >
              <span>💳</span>
              <span className="hidden sm:inline">Billetera</span>
            </Link>
            <div className="pl-2 border-l border-white/10">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-10 flex-1 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              ● Mercado Descentralizado
            </span>
            <h1 className="font-luxury text-3xl font-black uppercase text-white tracking-tight">
              Mercado P2P Oficial
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Adquirí entradas oficiales puestas en reventa por otros usuarios con transferencia directa al Alias del vendedor.
            </p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-white/10 rounded-3xl bg-[#0c0f17] max-w-md mx-auto">
            <span className="text-4xl block">🔄</span>
            <p className="text-sm text-slate-300 font-bold">No hay entradas publicadas en reventa en este momento.</p>
            <p className="text-xs text-slate-500">Publicá tu entrada desde tu Billetera Digital si no vas a poder asistir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-[#0c0f17] border border-white/5 hover:border-amber-500/40 transition-all duration-300 p-6 flex flex-col justify-between space-y-6 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[9px] font-bold uppercase">
                      ★ Reventa Verificada
                    </span>
                    <span className="text-[10px] text-slate-400">Vendedor: {item.sellerName}</span>
                  </div>

                  <div>
                    <h3 className="font-luxury text-lg font-bold text-white leading-snug">
                      {item.eventName}
                    </h3>
                    <span className="text-xs text-amber-400 font-bold block pt-1">
                      {item.tierName}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Precio Original:</span>
                    <span className="line-through">${item.originalPrice.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/5">
                    <span className="text-slate-300 font-bold">Precio de Venta:</span>
                    <span className="text-xl font-black text-amber-400">${item.price.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyListing(item)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer tracking-wider"
                >
                  Comprar Entrada →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE TRANSFERENCIA P2P */}
      {selectedListing && (
        <div
          onClick={() => setSelectedListing(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                  Checkout P2P Directo
                </span>
                <h3 className="font-luxury text-base font-bold uppercase text-white tracking-wide pt-1">
                  {selectedListing.eventName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-white text-base p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Tanda:</span>
                  <span className="font-bold text-white">{selectedListing.tierName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vendedor:</span>
                  <span className="font-bold text-white">{selectedListing.sellerName}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-white/5 pt-2">
                  <span>Alias de Transferencia:</span>
                  <span className="font-black text-emerald-400 text-sm select-all bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedListing.sellerAlias}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Monto a Transferir:</span>
                  <span className="font-black text-amber-400 text-base">
                    ${selectedListing.price.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                <strong>Instrucciones:</strong> Transferí el monto exacto al Alias indicado desde tu billetera virtual (Mercado Pago, Ualá, Banco). Una vez realizada, marcá la casilla de confirmación para recibir tu pase holográfico.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="confirm-transfer"
                  checked={hasConfirmedTransfer}
                  onChange={(e) => setHasConfirmedTransfer(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
                <label htmlFor="confirm-transfer" className="text-slate-200 cursor-pointer font-bold">
                  Ya realicé la transferencia al Alias del vendedor
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 py-3.5 border border-white/10 bg-[#07070a] text-slate-300 text-xs font-bold rounded-xl transition hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!hasConfirmedTransfer}
                  onClick={handleCompletePurchase}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black text-xs uppercase rounded-xl transition shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50 tracking-wider"
                >
                  Acreditar Entrada 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#050507] py-6 text-xs font-mono text-slate-500 text-center space-y-1 mt-auto">
        <p className="font-luxury text-amber-400 tracking-widest text-xs font-bold">LIVE EXPERIENCE</p>
      </footer>
    </div>
  );
}