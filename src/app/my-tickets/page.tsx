'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import HoloTicket, { TicketData } from '@/components/HoloTicket';
import { useSession } from '@/core/auth/useSession';

interface RawTicket {
  id: string;
  event_id?: string;
  holder_name?: string;
  customer_name?: string;
  holder_dni?: string;
  customer_dni?: string;
  holder_email?: string;
  customer_email?: string;
  tier_name?: string;
  auth_code?: string;
  qr_hash?: string;
  status?: string;
  purchase_price?: number;
  price_paid?: number;
  created_at?: string;
  events?: { name?: string; title?: string; date?: string; venue?: string };
}

interface ResaleListing {
  id: string;
  ticket_id: string;
  resale_price: number;
  seller_cbu_alias: string;
}

export default function MyTicketsPage() {
  const { user, isAuthenticated, loading: sessionLoading } = useSession();

  const [tickets, setTickets] = useState<RawTicket[]>([]);
  const [myResales, setMyResales] = useState<ResaleListing[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'for_sale' | 'used'>('all');

  const [ticketToSell, setTicketToSell] = useState<RawTicket | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('');
  const [inputAlias, setInputAlias] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const syncWallet = useCallback(async () => {
    if (!isAuthenticated) {
      setTickets([]);
      setMyResales([]);
      setLoadingTickets(false);
      return;
    }

    setLoadingTickets(true);
    try {
      const [ticketsRes, resalesRes] = await Promise.all([
        fetch('/api/my-tickets'),
        fetch('/api/resale'),
      ]);

      const ticketsData = await ticketsRes.json();
      setTickets(ticketsData.tickets || []);

      const resalesData = await resalesRes.json();
      const mine = (resalesData.resales || []).filter(
        (r: any) => (r.seller_email || '').toLowerCase() === (user?.email || '').toLowerCase()
      );
      setMyResales(mine);
    } catch (e) {
      console.error(e);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (!sessionLoading) syncWallet();
  }, [sessionLoading, syncWallet]);

  const openSellModal = (ticket: RawTicket) => {
    const basePrice = ticket.purchase_price || ticket.price_paid || 12000;
    setTicketToSell(ticket);
    setInputPrice(String(basePrice));
    setInputAlias('');
  };

  const handleCancelResale = async (resaleId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/resale/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resale_id: resaleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al retirar del mercado');
      await syncWallet();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishWithPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToSell) return;

    const finalPrice = Number(inputPrice);
    const minAllowed = ticketToSell.purchase_price || ticketToSell.price_paid || 12000;

    if (!finalPrice || finalPrice <= 0) return alert('Ingresá un precio válido.');
    if (finalPrice < minAllowed) {
      return alert(`El precio de reventa no puede ser inferior al valor original ($${minAllowed.toLocaleString('es-AR')}).`);
    }
    if (!inputAlias.trim()) return alert('Ingresá tu Alias personal para que el comprador pueda transferirte.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/resale/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketToSell.id,
          resale_price: finalPrice,
          seller_cbu_alias: inputAlias.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');

      setTicketToSell(null);
      await syncWallet();
      alert('¡Entrada publicada con éxito en el Marketplace de Reventa!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'active') return t.status === 'VALID' || t.status === 'AVAILABLE';
    if (filter === 'for_sale') return t.status === 'FROZEN_RESALE';
    if (filter === 'used') return t.status === 'USED' || t.status === 'RESOLD_BURNED';
    return true;
  });

  const loading = sessionLoading || loadingTickets;

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-white/5 bg-[#05070d] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-400 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20">
              O
            </div>
            <span className="font-luxury text-lg font-black tracking-[0.1em] uppercase text-white leading-none group-hover:text-blue-400 transition">
              LIVE EXPERIENCE
            </span>
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
              className="px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 text-blue-300 font-bold transition flex items-center gap-2"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Reventa</span>
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
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">
              ● Billetera Personal
            </span>
            <h1 className="font-luxury text-3xl font-black uppercase text-white tracking-tight">
              Billetera Digital
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Tus entradas oficiales, verificadas contra la base de Live Experience.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {(['all', 'active', 'for_sale', 'used'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl border transition uppercase font-bold text-[11px] cursor-pointer ${
                  filter === f
                    ? 'bg-blue-500/15 border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-[#0c0f16] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all'
                  ? `Todos (${tickets.length})`
                  : f === 'active'
                  ? `Habilitados (${tickets.filter((t) => t.status === 'VALID' || t.status === 'AVAILABLE').length})`
                  : f === 'for_sale'
                  ? `En Reventa (${tickets.filter((t) => t.status === 'FROZEN_RESALE').length})`
                  : `Historial (${tickets.filter((t) => t.status === 'USED' || t.status === 'RESOLD_BURNED').length})`}
              </button>
            ))}
          </div>
        </div>

        {/* GRILLA */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-slate-500">Cargando billetera...</div>
        ) : !isAuthenticated ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-white/10 rounded-3xl bg-[#0c0f16] max-w-md mx-auto">
            <span className="text-4xl block">🔒</span>
            <p className="text-sm text-white font-bold">Iniciá sesión para ver tu billetera</p>
            <Link
              href="/auth?redirect=/my-tickets"
              className="inline-block mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-white font-black text-xs uppercase rounded-xl transition"
            >
              Iniciar Sesión →
            </Link>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-white/10 rounded-3xl bg-[#0c0f16] max-w-md mx-auto">
            <span className="text-4xl block">💳</span>
            <p className="text-sm text-slate-300 font-bold">No tenés elementos en este filtro</p>
            <Link
              href="/"
              className="inline-block mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-white font-black text-xs uppercase rounded-xl transition"
            >
              Comprar en Cartelera
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredTickets.map((t) => {
              const qrValue = t.auth_code || t.qr_hash || t.id;
              const holoData: TicketData = {
                id: t.id,
                qrCode: qrValue,
                eventName: t.events?.name || t.events?.title || 'Evento Live Experience',
                tierName: t.tier_name || 'GENERAL',
                ownerName: t.holder_name || t.customer_name || user?.name || '',
                ownerDni: t.holder_dni || t.customer_dni || user?.dni || '',
                ownerEmail: t.holder_email || t.customer_email || user?.email,
                status: t.status === 'USED' ? 'used' : t.status === 'RESOLD_BURNED' ? 'resold' : 'active',
                purchasedAt: t.created_at ? new Date(t.created_at).toLocaleDateString('es-AR') : undefined,
              };

              const myResale = myResales.find((r) => r.ticket_id === t.id);
              const canResell = t.status === 'VALID' || t.status === 'AVAILABLE' || t.status === 'FROZEN_RESALE';

              return (
                <div key={t.id} className="flex flex-col space-y-3">
                  <HoloTicket ticket={holoData} />

                  <div className="p-4 rounded-2xl bg-[#0b1120] border border-white/10 flex flex-col items-center justify-center space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Código de Acceso</span>
                    <span className="text-xs font-mono font-bold text-blue-400">{qrValue}</span>
                  </div>

                  {canResell && (
                    <div className="max-w-sm w-full mx-auto space-y-2">
                      {t.status === 'FROZEN_RESALE' && myResale && (
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center text-xs text-blue-300 space-y-0.5">
                          <div>
                            En venta a{' '}
                            <span className="font-black text-white">
                              ${Number(myResale.resale_price).toLocaleString('es-AR')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Alias: <span className="text-emerald-400 font-bold">{myResale.seller_cbu_alias}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          t.status === 'FROZEN_RESALE' && myResale
                            ? handleCancelResale(myResale.id)
                            : openSellModal(t)
                        }
                        className={`w-full py-3 rounded-2xl font-bold uppercase text-xs border transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 ${
                          t.status === 'FROZEN_RESALE'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
                        }`}
                      >
                        <span>{t.status === 'FROZEN_RESALE' ? '✕' : '🔄'}</span>
                        <span>{t.status === 'FROZEN_RESALE' ? 'Retirar del Mercado' : 'Poner en Reventa Oficial'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL FIJAR PRECIO Y ALIAS */}
      {ticketToSell && (
        <div
          onClick={() => setTicketToSell(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl bg-[#0c0f16] border border-blue-500/40 p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-blue-400 uppercase font-bold block">Marketplace Oficial</span>
                <h3 className="text-xl font-black uppercase text-white">Fijar Precio y Alias</h3>
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
              <div className="p-4 rounded-2xl bg-[#05070d] border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Evento:</span>
                  <span className="font-bold text-white">{ticketToSell.events?.name || ticketToSell.events?.title}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tanda:</span>
                  <span className="font-bold text-white">{ticketToSell.tier_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Precio de publicación ($):
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  min={ticketToSell.purchase_price || ticketToSell.price_paid || 12000}
                  value={inputPrice}
                  onChange={(e) => setInputPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-[#05070d] rounded-xl border border-white/10 text-blue-400 font-black text-lg focus:outline-none focus:border-blue-500"
                />
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
                  className="w-full px-4 py-3 bg-[#05070d] rounded-xl border border-white/10 text-emerald-300 font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTicketToSell(null)}
                  className="flex-1 py-3.5 border border-white/10 bg-[#05070d] text-slate-300 text-xs font-bold rounded-xl transition hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publicando...' : 'Publicar Ahora →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#050507] py-6 text-xs font-mono text-slate-500 text-center space-y-1 mt-auto">
        <p className="font-luxury text-blue-400 tracking-widest text-xs font-bold">LIVE EXPERIENCE</p>
      </footer>
    </div>
  );
}
