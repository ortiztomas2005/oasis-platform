'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import TicketQrCard from '@/components/TicketQrCard';

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
          name: parsed.name || 'Socio',
          email: (parsed.email || '').toLowerCase().trim(),
          dni: parsed.dni || '',
        };
      }
    } catch {}
  }
  return null;
}

export default function ClubWalletPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; dni: string } | null>(null);

  const loadData = () => {
    const active = getActiveSession();
    setCurrentUser(active);

    if (!active || !active.email) {
      setTickets([]);
      return;
    }

    try {
      const raw = localStorage.getItem('oasis_issued_tickets');
      const allTickets = raw ? JSON.parse(raw) : [];

      // FILTRO EXCLUSIVO: Solo los pases deportivos del usuario logueado
      const mySportsTickets = allTickets.filter((t: any) => {
        const ticketEmail = (t.holderEmail || t.ownerEmail || '').toLowerCase().trim();
        const isSport = t.isSport || t.category === 'sport' || (t.id && t.id.includes('sport')) || t.eventName?.toLowerCase().includes('partido') || t.eventName?.toLowerCase().includes('club') || t.eventName?.toLowerCase().includes('fútbol');
        return ticketEmail === active.email && isSport;
      });

      setTickets(mySportsTickets);
    } catch (e) {
      console.error(e);
      setTickets([]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500 selection:text-black font-mono">
      
      {/* NAVBAR */}
      <header className="border-b border-white/5 bg-[#07070a] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/club/partidos" className="flex items-center gap-3.5 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20 font-luxury">
              ⚽
            </div>
            <div className="flex flex-col">
              <span className="font-luxury text-lg font-black tracking-[0.1em] uppercase text-white leading-none">
                ZONA CLUB
              </span>
              <span className="text-[10px] text-amber-400 font-mono tracking-widest mt-0.5">
                Billetera Deportiva Exclusiva
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/club/partidos"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition flex items-center gap-2"
            >
              <span>🏟️</span>
              <span className="hidden sm:inline">Cartelera de Partidos</span>
            </Link>
            <div className="pl-2 border-l border-white/10">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-10 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              ● Accesos Oficiales del Hincha
            </span>
            <h1 className="font-luxury text-3xl font-black uppercase text-white tracking-tight">
              Mi Billetera Deportiva
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Aquí visualizas tus pases exclusivos para los encuentros. Los colores y códigos visuales de los QR son definidos de forma institucional por el club.
            </p>
          </div>

          <Link
            href="/club/partidos"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 text-center"
          >
            + Adquirir Nuevos Pases
          </Link>
        </div>

        {/* GRILLA DE TICKETS DEPORTIVOS */}
        {!currentUser?.email ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-white/10 rounded-3xl bg-[#0c0f16] max-w-md mx-auto">
            <span className="text-4xl block">🔒</span>
            <p className="text-sm text-white font-bold">Iniciá sesión para ver tus pases deportivos</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center space-y-4 border border-dashed border-white/10 rounded-3xl bg-[#0c0f16] max-w-md mx-auto p-6">
            <span className="text-4xl block">⚽</span>
            <p className="text-sm text-slate-300 font-bold">No tienes pases deportivos en tu billetera</p>
            <p className="text-xs text-slate-500">
              Cuando compres o canjees una entrada para un partido, tu QR aparecerá automáticamente aquí con la estética oficial del club.
            </p>
            <Link
              href="/club/partidos"
              className="inline-block mt-2 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl uppercase"
            >
              Ver Partidos Disponibles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {tickets.map((t: any) => (
              <TicketQrCard key={t.id} ticket={t} token={t.qrToken || t.qrCode} />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#050507] py-6 text-xs font-mono text-slate-500 text-center space-y-1 mt-auto">
        <p className="font-luxury text-amber-400 tracking-widest text-xs font-bold">OASIS CLUB ECOSYSTEM</p>
      </footer>
    </div>
  );
}