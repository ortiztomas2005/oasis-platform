'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function MatchDetailContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id');

  const [match, setMatch] = useState<any | null>(null);
  const [globalPricing, setGlobalPricing] = useState({
    popularGeneral: 12000,
    popularMember: 0,
    popularSpecial: 6000,
    plateaGeneral: 25000,
    plateaMember: 15000,
    plateaSpecial: 12000,
    specialLabel: 'Menores / Jubilados'
  });

  useEffect(() => {
    try {
      const savedPricing = localStorage.getItem('le_club_global_pricing');
      if (savedPricing) {
        setGlobalPricing(JSON.parse(savedPricing));
      }

      const storedMatches = JSON.parse(localStorage.getItem('le_club_matches') || '[]');
      const foundMatch = storedMatches.find((m: any) => m.id === matchId) || storedMatches[0] || {
        id: 'm-1',
        name: 'CLUB ATLÉTICO VS RIVAL HISTÓRICO',
        date: '2026-09-15',
        startTime: '19:00',
        gateOpenTime: '17:00',
        ticketExpiryTime: '21:30',
        gateAccess: 'Puerta A y B (Popular) / Puerta C (Platea)',
        venue: 'Estadio Monumental',
        city: 'Buenos Aires',
        imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop',
        sectors: [
          { name: 'Popular Norte', capacity: 15000 },
          { name: 'Platea Baja', capacity: 5000 }
        ]
      };

      setMatch(foundMatch);
    } catch (e) {
      console.error(e);
    }
  }, [matchId]);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-100 flex items-center justify-center font-mono text-xs">
        Cargando detalles del encuentro...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black font-mono">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* HEADER PÚBLICO */}
      <header className="h-16 border-b border-white/5 bg-[#07070a] px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg">
            ⚽
          </div>
          <span className="font-luxury text-sm font-black text-white tracking-widest uppercase">
            DETALLE DEL ENCUENTRO
          </span>
        </div>
        <Link href="/events/partidos" className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-300 border border-white/10 text-xs font-bold">
          ← Volver a Cartelera
        </Link>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-8">
        
        <div className="rounded-3xl bg-[#0c0f17] border border-white/5 overflow-hidden shadow-2xl">
          <div className="relative aspect-[21/9] overflow-hidden">
            <img
              src={match.imageUrl || 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop'}
              alt={match.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f17] via-transparent to-black/40" />
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                📅 {match.date}
              </span>
              <h1 className="font-luxury text-2xl sm:text-4xl font-black text-white uppercase tracking-wide">
                {match.name}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">🏟️ Estadio & Sede</span>
                <strong className="text-white text-sm block">{match.venue}</strong>
                <span className="text-xs text-slate-400 block">{match.city}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">⚽ Horarios Clave</span>
                <span className="text-xs text-slate-300 block">Inicio: <strong className="text-amber-400">{match.startTime} HS</strong></span>
                <span className="text-xs text-slate-300 block">Apertura Puertas: <strong className="text-emerald-400">{match.gateOpenTime} HS</strong></span>
              </div>
              <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">🚪 Accesos Habilitados</span>
                <strong className="text-amber-300 text-xs block">{match.gateAccess || 'Puerta Principal'}</strong>
                <span className="text-[10px] text-slate-500 block">Cierre QR: {match.ticketExpiryTime || '21:30'} HS</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-luxury text-base font-black text-white uppercase border-b border-white/5 pb-2">
                💰 Tarifas Oficiales Vigentes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#07070a] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">Tribuna Popular</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Popular</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-slate-400">Público General:</span><strong className="text-amber-400">${globalPricing.popularGeneral.toLocaleString('es-AR')}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">Socio (Canje):</span><strong className="text-emerald-400">{globalPricing.popularMember === 0 ? 'FREE' : `$${globalPricing.popularMember.toLocaleString('es-AR')}`}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">{globalPricing.specialLabel}:</span><strong className="text-blue-400">${globalPricing.popularSpecial.toLocaleString('es-AR')}</strong></div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#07070a] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">Tribuna Platea</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Platea</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-slate-400">Público General:</span><strong className="text-amber-400">${globalPricing.plateaGeneral.toLocaleString('es-AR')}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">Socio:</span><strong className="text-emerald-400">${globalPricing.plateaMember.toLocaleString('es-AR')}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">{globalPricing.specialLabel}:</span><strong className="text-blue-400">${globalPricing.plateaSpecial.toLocaleString('es-AR')}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href={`/events/partidos/comprar?id=${match.id}`}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-2xl transition flex items-center justify-center shadow-xl shadow-amber-500/20 tracking-wider"
              >
                Continuar a Compra / Canje Digital 🎟️
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function MatchDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070a]" />}>
      <MatchDetailContent />
    </Suspense>
  );
}