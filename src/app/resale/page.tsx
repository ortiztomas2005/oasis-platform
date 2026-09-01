'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

function getActiveSession() {
  if (typeof window === 'undefined') return null;
  const rawSession = localStorage.getItem('oasis_current_session') || localStorage.getItem('oasis_customer_user');
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession);
      if (parsed && (parsed.email || parsed.name)) {
        return {
          name: parsed.name || 'Usuario',
          email: (parsed.email || '').toLowerCase().trim(),
          dni: parsed.dni || 'Sin DNI',
        };
      }
    } catch {}
  }
  return null;
}

export default function ResaleMarketplacePage() {
  const [forSaleTickets, setForSaleTickets] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; dni: string } | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [purchaseDone, setPurchaseDone] = useState<boolean>(false);

  const loadMarketplace = () => {
    setCurrentUser(getActiveSession());
    try {
      const raw = localStorage.getItem('oasis_issued_tickets');
      const allIssued = raw ? JSON.parse(raw) : [];

      // Filtra únicamente las entradas en estado FOR_SALE
      const activeForSale = allIssued.filter((t: any) => t.status === 'FOR_SALE');
      setForSaleTickets(activeForSale);
    } catch (e) {
      console.error(e);
      setForSaleTickets([]);
    }
  };

  useEffect(() => {
    loadMarketplace();
    window.addEventListener('storage', loadMarketplace);
    return () => window.removeEventListener('storage', loadMarketplace);
  }, []);

  const handleBuyResaleTicket = () => {
    if (!selectedTicket) return;
    const buyer = getActiveSession();

    if (!buyer || !buyer.email) {
      alert('Iniciá sesión en el menú superior para comprar esta entrada.');
      return;
    }

    if (buyer.email.toLowerCase() === (selectedTicket.holderEmail || '').toLowerCase()) {
      alert('No podés comprar tu propia entrada publicada.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const raw = localStorage.getItem('oasis_issued_tickets');
        const allIssued = raw ? JSON.parse(raw) : [];

        // 1. Quemar el ticket viejo del vendedor (pasa a RESOLD)
        const updatedOldTickets = allIssued.map((t: any) => {
          if (t.id === selectedTicket.id) {
            return {
              ...t,
              status: 'RESOLD',
              resoldTo: buyer.email,
              resoldAt: new Date().toISOString(),
            };
          }
          return t;
        });

        // 2. Emitir un ticket 100% virgen para el comprador con nuevo hash
        const randHex = Math.random().toString(16).substring(2, 10).toUpperCase();
        const tokenSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();

        const freshTicket = {
          id: `tkt-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
          eventId: selectedTicket.eventId,
          eventName: selectedTicket.eventName,
          tierName: selectedTicket.tierName,
          date: selectedTicket.date,
          venue: selectedTicket.venue,
          holderName: buyer.name,
          holderDni: buyer.dni,
          holderEmail: buyer.email,
          qrToken: `OASIS-${randHex}-${tokenSuffix}`,
          status: 'VALID',
          entryCutoffTime: selectedTicket.entryCutoffTime || '',
          purchaseDate: new Date().toISOString(),
          price: selectedTicket.resalePrice || selectedTicket.price,
          paymentMethod: 'Mercado Pago (P2P)',
          previousOwner: selectedTicket.holderEmail,
        };

        const finalTickets = [freshTicket, ...updatedOldTickets];
        localStorage.setItem('oasis_issued_tickets', JSON.stringify(finalTickets));

        setIsProcessing(false);
        setPurchaseDone(true);
        loadMarketplace();
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    }, 800);
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
                SECURE RESALE P2P
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
              Reventa Oficial P2P
            </h1>
            <p className="text-xs text-slate-400">
              Pases transferidos de forma transparente. Al comprar, el QR anterior se destruye y se emite uno nuevo a tu nombre.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold">
            <span>🛡️</span>
            <span>Garantía Antifraude Oficial</span>
          </div>
        </div>

        {/* LISTADO DE PASES EN VENTA */}
        {forSaleTickets.length === 0 ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-slate-800 rounded-3xl bg-[#131722]/30 max-w-md mx-auto">
            <span className="text-4xl block">🔄</span>
            <p className="text-sm text-white font-bold">No hay entradas publicadas en reventa en este momento</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Si compraste una entrada y no podés ir, podés publicarla desde tu sección de Mis Entradas.
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
            {forSaleTickets.map((t) => {
              const isOwnTicket = currentUser?.email && t.holderEmail?.toLowerCase() === currentUser.email.toLowerCase();
              const price = t.resalePrice || t.price || 15000;

              return (
                <div
                  key={t.id}
                  className="p-6 rounded-3xl bg-[#131722] border border-indigo-500/20 hover:border-indigo-500/50 flex flex-col justify-between space-y-4 shadow-xl transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
                        ● Reventa Verificada
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        Vendedor: {t.holderName}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-blue-400 font-bold block">
                        📅 {t.date} · {t.venue}
                      </span>
                      <h3 className="text-lg font-black uppercase text-white tracking-tight mt-0.5">
                        {t.eventName}
                      </h3>
                      <span className="text-xs text-slate-300 font-bold block mt-1">
                        Sector: {t.tierName}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Precio Oficial</span>
                      <span className="text-base font-black text-emerald-400">
                        ${price.toLocaleString('es-AR')}
                      </span>
                    </div>

                    {isOwnTicket ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase">
                        Tu Publicación
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setPurchaseDone(false);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl transition shadow-md shadow-indigo-600/30"
                      >
                        Comprar Pase →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE COMPRA DIRECTA EN REVENTA */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="max-w-md w-full rounded-3xl bg-[#131722] border border-indigo-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            {purchaseDone ? (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
                  ✅
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-white">¡Traspaso Completado!</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    El QR anterior fue destruido y tenés tu ticket nuevo a tu nombre en tu Billetera.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Link
                    href="/my-tickets"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl text-center transition shadow-lg shadow-blue-600/30"
                  >
                    Ver en Mis Entradas →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase font-bold block">
                      Transferencia Segura P2P
                    </span>
                    <h3 className="text-lg font-black uppercase text-white">
                      Confirmar Compra
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-slate-500 hover:text-white p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Evento:</span>
                    <span className="font-bold text-white">{selectedTicket.eventName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tanda:</span>
                    <span className="font-bold text-white">{selectedTicket.tierName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vendedor:</span>
                    <span className="font-bold text-white">{selectedTicket.holderName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                    <span>Comprador Final:</span>
                    <span className="font-bold text-emerald-400">
                      {currentUser?.name || 'Tu cuenta'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Total a Pagar:</span>
                  <span className="text-xl font-black text-emerald-400">
                    ${(selectedTicket.resalePrice || selectedTicket.price || 15000).toLocaleString('es-AR')}
                  </span>
                </div>

                <button
                  onClick={handleBuyResaleTicket}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isProcessing ? 'Reemitiendo QR y Transfiriendo...' : 'Pagar y Reemitir Ticket a Mi Nombre →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0c0f16] py-6 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>OASIS LIVE · Mercado Secundario Seguro</span>
          <span className="text-[11px] text-slate-400">Reemisión Criptográfica Inmediata</span>
        </div>
      </footer>
    </div>
  );
}