'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SportsHubPage() {
  const [matches, setMatches] = useState<any[]>([]);
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
      if (storedMatches.length > 0) {
        setMatches(storedMatches);
      } else {
        const defaultMatches = [
          {
            id: 'm-1',
            name: 'CLUB ATLÉTICO VS RIVAL HISTÓRICO',
            date: 'Sábado 15 de Septiembre',
            startTime: '19:00',
            gateOpenTime: '17:00',
            venue: 'Estadio Monumental',
            city: 'Buenos Aires',
            imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop',
            status: 'ACTIVE'
          }
        ];
        setMatches(defaultMatches);
        localStorage.setItem('le_club_matches', JSON.stringify(defaultMatches));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black font-mono">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <header className="h-20 border-b border-white/10 bg-[#07070a] px-8 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20 font-luxury">
            LE
          </div>
          <span className="font-luxury text-sm font-black text-white tracking-widest uppercase">
            LIVE EXPERIENCE | DEPORTES
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-bold">
          <Link href="/" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition">
            ← Volver a Fiestas
          </Link>
          <Link href="/events/partidos/comprar?id=m-1" className="px-4 py-2 rounded-xl bg-amber-400 text-black font-black hover:bg-amber-300 transition shadow-lg shadow-amber-500/20">
            Comprar / Canjear 🎟️
          </Link>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL DE DEPORTES */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-10">
        
        {/* BANNER DESTACADO DEPORTIVO */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-[#0c0f17] shadow-2xl p-8 sm:p-12 flex flex-col justify-end min-h-[320px] group">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop"
              alt="Estadio"
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/60 to-transparent" />
          </div>

          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
              ⚽ MÓDULO OFICIAL DEL CLUB
            </span>
            <h1 className="font-luxury text-3xl sm:text-5xl font-black text-white uppercase tracking-wide">
              Cartelera de Partidos
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gestioná los accesos a la popular o platea. Tarifas oficiales sincronizadas y canje exclusivo para socios sin filas ni demoras.
            </p>
          </div>
        </div>

        {/* LISTADO DE ENCUENTROS */}
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-luxury text-xl font-black text-white uppercase tracking-wider">Próximos Encuentros</h2>
            <p className="text-xs text-slate-400 mt-1">Seleccioná un partido para ver accesos, puertas y realizar tu compra o canje.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div key={match.id} className="rounded-3xl bg-[#0c0f17] border border-white/5 overflow-hidden shadow-xl flex flex-col justify-between group">
                <div className="aspect-video relative overflow-hidden">
                  <img src={match.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase">
                    📅 {match.date}
                  </span>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-luxury text-base font-black text-white group-hover:text-amber-400 transition">{match.name}</h3>
                    <p className="text-xs text-slate-400">🏟️ {match.venue} ({match.city})</p>
                    <p className="text-xs text-slate-400">⚽ Inicio: <strong className="text-white">{match.startTime} HS</strong></p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#07070a] border border-white/5 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400"><span>Popular General:</span><strong className="text-amber-400">${globalPricing.popularGeneral.toLocaleString('es-AR')}</strong></div>
                    <div className="flex justify-between text-slate-400"><span>Platea General:</span><strong className="text-amber-400">${globalPricing.plateaGeneral.toLocaleString('es-AR')}</strong></div>
                  </div>

                  <Link 
                    href={`/events/partidos/comprar?id=${match.id}`}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl transition flex items-center justify-center shadow-lg shadow-amber-500/20 tracking-wider"
                  >
                    Ver Partido & Comprar 🎟️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}