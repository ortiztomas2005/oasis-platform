'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import HoloTicket, { TicketData } from '@/components/HoloTicket';

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

export default function MyTicketsPage() {
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; dni: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'for_sale' | 'used' | 'bar'>('all');

  const [ticketToSell, setTicketToSell] = useState<any | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('');
  const [inputAlias, setInputAlias] = useState<string>('');

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
            const { resalePrice, sellerAlias, ...rest } = t;
            return { ...rest, status: 'VALID' };
          }
          return t;
        });
        localStorage.setItem('oasis_issued_tickets', JSON.stringify(updated));

        const rawP2P = localStorage.getItem('le_p2p_listings');
        if (rawP2P) {
          const p2pList = JSON.parse(rawP2P);
          const filteredP2P = p2pList.filter((p: any) => p.ticketId !== ticket.id);
          localStorage.setItem('le_p2p_listings', JSON.stringify(filteredP2P));
        }

        syncWallet();
      } catch (err) {
        console.error(err);
      }
    } else {
      const basePrice = ticket.price || 12000;
      setTicketToSell(ticket);
      setInputPrice(String(basePrice));
      setInputAlias('');
    }
  };

  const handlePublishWithPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToSell || !currentUser) return;

    const finalPrice = Number(inputPrice);
    const minAllowed = ticketToSell.price || 12000;

    if (!finalPrice || finalPrice <= 0) {
      alert('Ingresá un precio válido.');
      return;
    }

    if (finalPrice < minAllowed) {
      alert(`El precio de reventa no puede ser inferior al valor original de adquisición ($${minAllowed.toLocaleString('es-AR')}).`);
      return;
    }

    if (!inputAlias.trim()) {
      alert('Ingresá tu Alias personal para que el comprador pueda transferirte.');
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
            sellerAlias: inputAlias.trim(),
          };
        }
        return t;
      });

      localStorage.setItem('oasis_issued_tickets', JSON.stringify(updated));

      const rawP2P = localStorage.getItem('le_p2p_listings');
      const p2pList = rawP2P ? JSON.parse(rawP2P) : [];
      const newListing = {
        id: `p2p-${Date.now()}`,
        ticketId: ticketToSell.id,
        eventName: ticketToSell.eventName,
        tierName: ticketToSell.tierName,
        originalPrice: minAllowed,
        sellerName: currentUser.name,
        sellerAlias: inputAlias.trim(),
        price: finalPrice,
        status: 'AVAILABLE'
      };

      localStorage.setItem('le_p2p_listings', JSON.stringify([newListing, ...p2pList]));

      setTicketToSell(null);
      syncWallet();
      alert('¡Entrada publicada con éxito en el Mercado P2P con tu Alias!');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = userTickets.filter((t) => {
    if (filter === 'active') return (t.status === 'VALID' || t.status === 'active') && !t.isBarOrder;
    if (filter === 'for_sale') return t.status === 'FOR_SALE';
    if (filter === 'used') return t.status === 'USED' || t.status === 'RESOLD';
    if (filter === 'bar') return t.isBarOrder;
    return true;
  });

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
              href="/resale"
              className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-amber-300 font-bold transition flex items-center gap-2"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Resale</span>
            </Link>
            <Link
              href="/bar"
              className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-amber-400 font-bold transition flex items-center gap-2"
            >
              <span>🍸</span>
              <span className="hidden sm:inline">Barra</span>
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
              ● Billetera Personal
            </span>
            <h1 className="font-luxury text-3xl font-black uppercase text-white tracking-tight">
              Billetera Digital
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Tus pases de acceso y consumiciones de barra unificados en pases holográficos oficiales.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {(['all', 'active', 'for_sale', 'used', 'bar'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl border transition uppercase font-bold text-[11px] cursor-pointer ${
                  filter === f
                    ? f === 'bar'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm'
                    : 'bg-[#0c0f16] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all'
                  ? `Todos (${userTickets.length})`
                  : f === 'active'
                  ? `Habilitados (${userTickets.filter((t) => (t.status === 'VALID' || t.status === 'active') && !t.isBarOrder).length})`
                  : f === 'for_sale'
                  ? `En Reventa (${userTickets.filter((t) => t.status === 'FOR_SALE').length})`
                  : f === 'bar'
                  ? `🍸 Barra (${userTickets.filter((t) => t.isBarOrder).length})`
                  : 'Historial'}
              </button>
            ))}
          </div>
        </div>

        {/* GRILLA */}
        {!currentUser?.email ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-white/10 rounded-3xl bg-[#0c0f16] max-w-md mx-auto">
            <span className="text-4xl block">🔒</span>
            <p className="text-sm text-white font-bold">Iniciá sesión para ver tu billetera</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-white/10 rounded-3xl bg-[#0c0f16] max-w-md mx-auto">
            <span className="text-4xl block">💳</span>
            <p className="text-sm text-slate-300 font-bold">No tenés elementos en este filtro</p>
            <Link
              href="/"
              className="inline-block mt-3 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition"
            >
              Comprar en Cartelera
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredTickets.map((t: any) => {
              const isBar = t.isBarOrder;

              const holoData: TicketData = {
                id: t.id,
                qrCode: t.qrToken || t.qrCode || `LE-TK-${t.id.slice(-4)}`,
                eventName: t.eventName,
                tierName: isBar ? 'Presentá este QR en barra' : t.tierName,
                ownerName: t.holderName || t.ownerName || currentUser.name,
                ownerDni: t.holderDni || t.ownerDni || currentUser.dni,
                ownerEmail: t.holderEmail || t.ownerEmail || currentUser.email,
                status: t.status === 'RESOLD' ? 'resold' : t.status === 'USED' || t.status === 'REDEEMED' ? 'used' : 'active',
                purchasedAt: t.purchaseDate ? new Date(t.purchaseDate).toLocaleDateString('es-AR') : t.purchasedAt,
              };

              const canResell = !isBar && (t.status === 'VALID' || t.status === 'active' || t.status === 'FOR_SALE');
              const qrTokenValue = t.qrToken || t.qrCode || `LE-TK-${t.id.slice(-4)}`;

              return (
                <div key={t.id} className="flex flex-col space-y-3">
                  <HoloTicket ticket={holoData} />

                 {/* VISUALIZADOR DE QR */}
                  <div className="p-4 rounded-2xl bg-[#0c0f17] border border-white/10 flex flex-col items-center justify-center space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Código de Acceso</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{qrTokenValue}</span>
                  </div>

                  {canResell && (
                    <div className="max-w-sm w-full mx-auto space-y-2">
                      {t.status === 'FOR_SALE' && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-xs text-amber-300 space-y-0.5">
                          <div>En venta a <span className="font-black text-white">${(t.resalePrice || t.price).toLocaleString('es-AR')}</span></div>
                          {t.sellerAlias && <div className="text-[10px] text-slate-400 font-mono">Alias: <span className="text-emerald-400 font-bold">{t.sellerAlias}</span></div>}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleButtonClick(t)}
                        className={`w-full py-3 rounded-2xl font-bold uppercase text-xs border transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          t.status === 'FOR_SALE'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
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

      {/* MODAL FIJAR PRECIO Y ALIAS P2P */}
      {ticketToSell && (
        <div
          onClick={() => setTicketToSell(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl bg-[#0c0f16] border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold block">
                  Mercado Oficial P2P
                </span>
                <h3 className="text-xl font-black uppercase text-white">
                  Fijar Precio y Alias
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketToSell(null)}
                className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishWithPrice} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Evento:</span>
                  <span className="font-bold text-white">{ticketToSell.eventName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tanda:</span>
                  <span className="font-bold text-white">{ticketToSell.tierName}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-white/5 pt-2">
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-black text-base">$</span>
                  <input
                    type="number"
                    autoFocus
                    required
                    min={ticketToSell.price || 12000}
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-[#07070a] rounded-xl border border-white/10 text-amber-400 font-black text-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 block">
                  * Precio mínimo requerido: ${ (ticketToSell.price || 12000).toLocaleString('es-AR') }. Sin límite máximo.
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Tu Alias personal (para recibir el pago):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: tu.alias.mp"
                  value={inputAlias}
                  onChange={(e) => setInputAlias(e.target.value)}
                  className="w-full px-4 py-3 bg-[#07070a] rounded-xl border border-white/10 text-emerald-300 font-bold text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 block">
                  El comprador transferirá directamente a este Alias.
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTicketToSell(null)}
                  className="flex-1 py-3.5 border border-white/10 bg-[#07070a] text-slate-300 text-xs font-bold rounded-xl transition hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Publicar Ahora →
                </button>
              </div>
            </form>
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