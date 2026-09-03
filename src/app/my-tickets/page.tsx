'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import HoloTicket, { TicketData } from '@/components/HoloTicket';

function getActiveSession() {
  if (typeof window === 'undefined') return null;
  const rawSession =
    localStorage.getItem('oasis_current_session') || localStorage.getItem('oasis_customer_user');
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

export default function MyTicketsPage() {
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; dni: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'for_sale' | 'used'>('all');

  const [ticketToSell, setTicketToSell] = useState<any | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('');

  const syncWallet = () => {
    const active = getActiveSession();
    setCurrentUser(active);

    if (!active || !active.email) {
      setUserTickets([]);
      return;
    }

    try {
      const rawTickets = localStorage.getItem('oasis_issued_tickets');
      const allIssued = rawTickets ? JSON.parse(rawTickets) : [];

      const myIssued = allIssued.filter((t: any) => {
        const ticketEmail = (t.holderEmail || t.ownerEmail || '').toLowerCase().trim();
        return ticketEmail === active.email;
      });

      setUserTickets(myIssued);
    } catch (e) {
      console.error(e);
      setUserTickets([]);
    }
  };

  useEffect(() => {
    syncWallet();
    window.addEventListener('storage', syncWallet);
    return () => window.removeEventListener('storage', syncWallet);
  }, []);

  const handleButtonClick = (ticket: any) => {
    if (ticket.status === 'FOR_SALE') {
      try {
        const rawTickets = localStorage.getItem('oasis_issued_tickets');
        const allIssued = rawTickets ? JSON.parse(rawTickets) : [];
        const updated = allIssued.map((t: any) => {
          if (t.id === ticket.id) {
            const { resalePrice, ...rest } = t;
            return { ...rest, status: 'VALID' };
          }
          return t;
        });
        localStorage.setItem('oasis_issued_tickets', JSON.stringify(updated));
        syncWallet();
      } catch (err) {
        console.error(err);
      }
    } else {
      const basePrice = ticket.price || 12000;
      setTicketToSell(ticket);
      setInputPrice(String(basePrice));
    }
  };

  const handlePublishWithPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToSell) return;

    const finalPrice = Number(inputPrice);
    const minAllowed = ticketToSell.price || 12000;

    if (!finalPrice || finalPrice <= 0) {
      alert('Ingresá un precio válido.');
      return;
    }

    // Validación de precio mínimo (no puede ser menor al valor de adquisición)
    if (finalPrice < minAllowed) {
      alert(`El precio de reventa no puede ser inferior al valor original de adquisición ($${minAllowed.toLocaleString('es-AR')}).`);
      return;
    }

    try {
      const rawTickets = localStorage.getItem('oasis_issued_tickets');
      const allIssued = rawTickets ? JSON.parse(rawTickets) : [];

      const updated = allIssued.map((t: any) => {
        if (t.id === ticketToSell.id) {
          return {
            ...t,
            status: 'FOR_SALE',
            resalePrice: finalPrice,
          };
        }
        return t;
      });

      localStorage.setItem('oasis_issued_tickets', JSON.stringify(updated));
      setTicketToSell(null);
      syncWallet();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = userTickets.filter((t) => {
    if (filter === 'active') return t.status === 'VALID' || t.status === 'active';
    if (filter === 'for_sale') return t.status === 'FOR_SALE';
    if (filter === 'used') return t.status === 'USED' || t.status === 'RESOLD';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-[#0f131c]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#161a26] hover:border-slate-700 text-slate-300 text-xs font-mono font-bold transition flex items-center gap-2"
            >
              <span>←</span>
              <span>Cartelera</span>
            </Link>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-white leading-none">
                OASIS
              </span>
              <span className="text-[9px] text-blue-400 font-mono tracking-wider mt-0.5">
                DIGITAL WALLET
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/resale"
              className="px-3.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/10"
            >
              <span>🔄</span>
              <span>Mercado P2P</span>
            </Link>
            <Link
              href="/bar"
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>🍸</span>
              <span>Barra</span>
            </Link>
            <div className="pl-1.5 border-l border-slate-800">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8 flex-1 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                ● Billetera Personal
              </span>
              {currentUser?.email && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  {currentUser.name} · {currentUser.email}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Mis Entradas
            </h1>
            <p className="text-xs text-slate-400">
              Pases oficiales. Podés ponerlos en reventa indicando el precio de venta (mínimo el valor de adquisición).
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {(['all', 'active', 'for_sale', 'used'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl border transition uppercase font-bold text-[11px] ${
                  filter === f
                    ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-[#131722] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all'
                  ? `Todos (${userTickets.length})`
                  : f === 'active'
                  ? `Habilitados (${userTickets.filter((t) => t.status === 'VALID' || t.status === 'active').length})`
                  : f === 'for_sale'
                  ? `En Reventa (${userTickets.filter((t) => t.status === 'FOR_SALE').length})`
                  : 'Historial'}
              </button>
            ))}
          </div>
        </div>

        {/* GRILLA */}
        {!currentUser?.email ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-slate-800 rounded-3xl bg-[#131722]/30 max-w-md mx-auto">
            <span className="text-4xl block">🔒</span>
            <p className="text-sm text-white font-bold">Iniciá sesión para ver tus entradas</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-slate-800 rounded-3xl bg-[#131722]/30 max-w-md mx-auto">
            <span className="text-4xl block">🎟️</span>
            <p className="text-sm text-slate-300 font-bold">No tenés entradas en este filtro</p>
            <Link
              href="/"
              className="inline-block mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl transition"
            >
              Comprar en Cartelera
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredTickets.map((t: any) => {
              const holoData: TicketData = {
                id: t.id,
                qrCode: t.qrToken || t.qrCode || `OASIS-TK-${t.id.slice(-4)}`,
                eventName: t.eventName,
                tierName: t.tierName,
                ownerName: t.holderName || t.ownerName || currentUser.name,
                ownerDni: t.holderDni || t.ownerDni || currentUser.dni,
                ownerEmail: t.holderEmail || t.ownerEmail || currentUser.email,
                status: t.status === 'RESOLD' ? 'resold' : t.status === 'USED' ? 'used' : 'active',
                purchasedAt: t.purchaseDate ? new Date(t.purchaseDate).toLocaleDateString('es-AR') : t.purchasedAt,
              };

              const canResell = t.status === 'VALID' || t.status === 'active' || t.status === 'FOR_SALE';

              return (
                <div key={t.id} className="flex flex-col space-y-3">
                  <HoloTicket ticket={holoData} />

                  {canResell && (
                    <div className="max-w-sm w-full mx-auto space-y-2">
                      {t.status === 'FOR_SALE' && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-xs text-amber-300">
                          En venta a <span className="font-black text-white">${(t.resalePrice || t.price).toLocaleString('es-AR')}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleButtonClick(t)}
                        className={`w-full py-3 rounded-2xl font-bold uppercase text-xs border transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          t.status === 'FOR_SALE'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                            : 'bg-indigo-600/25 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/40'
                        }`}
                      >
                        <span>{t.status === 'FOR_SALE' ? '✕' : '🔄'}</span>
                        <span>
                          {t.status === 'FOR_SALE' ? 'Retirar del Mercado' : 'Poner en Reventa Oficial'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL FIJAR PRECIO (MÍNIMO EL ORIGINAL, SIN TOPE MÁXIMO) */}
      {ticketToSell && (
        <div
          onClick={() => setTicketToSell(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl bg-[#131722] border border-indigo-500/50 p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-indigo-400 uppercase font-bold block">
                  Mercado Oficial P2P
                </span>
                <h3 className="text-xl font-black uppercase text-white">
                  Fijar Precio de Venta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketToSell(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishWithPrice} className="space-y-5">
              <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Evento:</span>
                  <span className="font-bold text-white">{ticketToSell.eventName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tanda:</span>
                  <span className="font-bold text-white">{ticketToSell.tierName}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Valor de Adquisición:</span>
                  <span className="font-bold text-emerald-400">
                    ${(ticketToSell.price || 12000).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Precio de publicación ($):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-base">$</span>
                  <input
                    type="number"
                    autoFocus
                    required
                    min={ticketToSell.price || 12000}
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-[#181d2a] rounded-xl border border-slate-700 text-emerald-400 font-black text-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 block">
                  * Precio mínimo requerido: ${ (ticketToSell.price || 12000).toLocaleString('es-AR') }. Sin límite máximo.
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTicketToSell(null)}
                  className="flex-1 py-3.5 border border-slate-800 bg-[#161a26] text-slate-300 text-xs font-bold rounded-xl transition hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                  Publicar Ahora →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0c0f16] py-6 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>OASIS LIVE · Acceso Personal Nominado</span>
        </div>
      </footer>
    </div>
  );
}