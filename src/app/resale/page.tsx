'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

interface Resale {
  id: string;
  ticket_id: string;
  event_id: string;
  resale_price: number;
  seller_name: string;
  seller_email: string;
  seller_cbu_alias: string;
  status: string;
  events?: { name?: string; title?: string; date?: string; venue?: string };
  tickets?: { tier_name?: string };
}

export default function ResaleMarketplacePage() {
  const [resales, setResales] = useState<Resale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Resale | null>(null);

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [pendingInfo, setPendingInfo] = useState<{ alias: string } | null>(null);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resale');
      const data = await res.json();
      setResales(data.resales || []);
    } catch (e) {
      console.error(e);
      setResales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    if (buyerEmail.toLowerCase().trim() === (selected.seller_email || '').toLowerCase().trim()) {
      alert('No podés comprar tu propia entrada publicada.');
      return;
    }

    setPurchasing(true);
    try {
      const res = await fetch('/api/resale/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resale_id: selected.id,
          buyer_name: buyerName.trim(),
          buyer_email: buyerEmail.toLowerCase().trim(),
          buyer_dni: buyerDni.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar la compra');

      // El ticket recién se emite cuando Mercado Pago confirma el pago (ver
      // /api/webhooks/mercadopago) — nunca al tocar este botón.
      if (data.init_point) {
        window.location.href = data.init_point;
        return;
      }

      // Sin MP_ACCESS_TOKEN configurado no hay pasarela real: se lo avisamos
      // al comprador en vez de fingir que la compra ya se completó.
      setPendingInfo({ alias: selected.seller_cbu_alias });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setPendingInfo(null);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerDni('');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-indigo-500 selection:text-white">
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
              <span className="text-[9px] text-indigo-400 font-mono tracking-wider mt-0.5">
                SECURE RESALE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/my-tickets"
              className="px-3.5 py-1.5 rounded-xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>🎟️</span>
              <span>Mis Entradas</span>
            </Link>
            <div className="pl-1.5 border-l border-slate-800">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8 flex-1 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block">
              ● Mercado Verificado sin Sobrecostos
            </span>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Reventa Oficial
            </h1>
            <p className="text-xs text-slate-400">
              Al confirmarse el pago, el QR anterior se destruye y se emite uno nuevo a tu nombre.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold">
            <span>🛡️</span>
            <span>Garantía Antifraude Oficial</span>
          </div>
        </div>

        {/* LISTADO DE PASES EN VENTA */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-slate-500">Cargando publicaciones...</div>
        ) : resales.length === 0 ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-slate-800 rounded-3xl bg-[#131722]/30 max-w-md mx-auto">
            <span className="text-4xl block">🔄</span>
            <p className="text-sm text-white font-bold">No hay entradas publicadas en reventa en este momento</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Si compraste una entrada y no podés ir, podés publicarla desde el detalle de tu ticket en Mis Entradas.
            </p>
            <Link
              href="/my-tickets"
              className="inline-block mt-3 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition"
            >
              Ir a Mis Entradas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resales.map((r) => (
              <div
                key={r.id}
                className="p-6 rounded-3xl bg-[#131722] border border-indigo-500/20 hover:border-indigo-500/50 flex flex-col justify-between space-y-4 shadow-xl transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
                      ● Reventa Verificada
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">Vendedor: {r.seller_name}</span>
                  </div>

                  <div>
                    <span className="text-xs text-blue-400 font-bold block">
                      📅 {r.events?.date || 'Fecha a confirmar'} · {r.events?.venue || ''}
                    </span>
                    <h3 className="text-lg font-black uppercase text-white tracking-tight mt-0.5">
                      {r.events?.name || r.events?.title || 'Evento OASIS'}
                    </h3>
                    <span className="text-xs text-slate-300 font-bold block mt-1">
                      Sector: {r.tickets?.tier_name || 'GENERAL'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Precio de Reventa</span>
                    <span className="text-base font-black text-emerald-400">
                      ${Number(r.resale_price).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelected(r)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl transition shadow-md shadow-indigo-600/30"
                  >
                    Comprar Pase →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE COMPRA */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="max-w-md w-full rounded-3xl bg-[#131722] border border-indigo-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            {pendingInfo ? (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
                  ⏳
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-white">Pasarela no disponible aún</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Este entorno todavía no tiene Mercado Pago conectado, así que no podemos cobrarte automáticamente.
                    Coordiná la transferencia directo con el vendedor al alias <strong className="text-emerald-400">{pendingInfo.alias}</strong> y
                    pedile que te confirme por fuera de la plataforma.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl transition"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleBuy} className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase font-bold block">
                      Transferencia Segura
                    </span>
                    <h3 className="text-lg font-black uppercase text-white">Confirmar Compra</h3>
                  </div>
                  <button type="button" onClick={closeModal} className="text-slate-500 hover:text-white p-1">
                    ✕
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Evento:</span>
                    <span className="font-bold text-white">{selected.events?.name || selected.events?.title}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sector:</span>
                    <span className="font-bold text-white">{selected.tickets?.tier_name || 'GENERAL'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vendedor:</span>
                    <span className="font-bold text-white">{selected.seller_name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Nombre y Apellido</label>
                    <input
                      type="text" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full mt-1 bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">DNI</label>
                    <input
                      type="text" required value={buyerDni} onChange={(e) => setBuyerDni(e.target.value)}
                      className="w-full mt-1 bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Email</label>
                    <input
                      type="email" required value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full mt-1 bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Total a Pagar:</span>
                  <span className="text-xl font-black text-emerald-400">
                    ${Number(selected.resale_price).toLocaleString('es-AR')}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={purchasing}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {purchasing ? 'Iniciando pago...' : 'Pagar y Reemitir Ticket a Mi Nombre →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0c0f16] py-6 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>OASIS LIVE · Mercado Secundario Seguro</span>
          <span className="text-[11px] text-slate-400">Reemisión Criptográfica al Confirmarse el Pago</span>
        </div>
      </footer>
    </div>
  );
}
