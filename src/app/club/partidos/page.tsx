'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MatchItem {
  id: string;
  clubName?: string;
  clubLogo?: string;
  primaryColor?: string;
  accentColor?: string;
  name: string;
  date: string;
  startTime: string;
  venue: string;
  city: string;
  imageUrl: string;
  status: 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}

export default function SportsCatalogPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [globalPricing, setGlobalPricing] = useState({
    popularGeneral: 12000,
    popularMember: 0,
    popularSpecial: 6000,
    plateaGeneral: 25000,
    plateaMember: 15000,
    plateaSpecial: 12000,
  });

  useEffect(() => {
    try {
      const savedPricing = localStorage.getItem('le_club_global_pricing');
      if (savedPricing) {
        setGlobalPricing(JSON.parse(savedPricing));
      }

      const globalConfig = JSON.parse(localStorage.getItem('oasis_club_config') || localStorage.getItem('le_club_config') || '{}');
      const defaultClubName = globalConfig.clubName || 'CLUB ATLÉTICO';
      const defaultClubLogo = globalConfig.clubLogo || '';
      const defaultPrimaryColor = globalConfig.primaryColor || '#f59e0b';
      const defaultAccentColor = globalConfig.accentColor || '#fbbf24';

      const storedMatches = JSON.parse(localStorage.getItem('le_club_matches') || '[]');
      if (storedMatches.length > 0) {
        const activeMatches = storedMatches
          .filter((m: MatchItem) => !m.status || m.status === 'ACTIVE')
          .map((m: MatchItem) => ({
            ...m,
            clubName: m.clubName || defaultClubName,
            clubLogo: m.clubLogo || defaultClubLogo,
            primaryColor: m.primaryColor || defaultPrimaryColor,
            accentColor: m.accentColor || defaultAccentColor
          }));
        setMatches(activeMatches);
      } else {
        const defaultMatches: MatchItem[] = [
          {
            id: 'm-1',
            clubName: defaultClubName,
            clubLogo: defaultClubLogo,
            primaryColor: defaultPrimaryColor,
            accentColor: defaultAccentColor,
            name: 'VS RIVAL HISTÓRICO',
            date: 'Sábado 15 de Septiembre',
            startTime: '19:00',
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

      {/* HEADER GENERAL DE LA TIQUETERA MULTICLUB */}
      <header className="h-20 border-b border-white/10 bg-[#07070a] px-8 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20 font-luxury">
            ⚽
          </div>
          <span className="font-luxury text-sm font-black text-white tracking-widest uppercase">
            OASIS | TICKETERA DEPORTIVA MULTICLUB
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs font-bold">
          <Link
            href="/club"
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer flex items-center gap-2"
          >
            <span>💳</span>
            <span>Mi Billetera Club</span>
          </Link>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition cursor-pointer"
          >
            ← Volver a Fiestas (Home)
          </Link>
        </div>
      </header>

      {/* CONTENIDO DE LA CARTELERA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-10">
        
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-[#0c0f17] shadow-2xl p-6 sm:p-12 flex flex-col justify-center min-h-[280px] sm:min-h-[320px] group">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop"
              alt="Estadio"
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/60 to-transparent" />
          </div>

          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
              ● CARTELERA OFICIAL MULTICLUB
            </span>
            <h1 className="font-luxury text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-wide leading-tight">
              Próximos Encuentros
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explorá los partidos de los diferentes clubes asociados, adquirí tus plateas, populares o realizá tus canjes de socio.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-luxury text-xl font-black text-white uppercase tracking-wider">Partidos Disponibles</h2>
            <p className="text-xs text-slate-400 mt-1">Elegí tu encuentro para sacar las entradas.</p>
          </div>

          {matches.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#0c0f17] border border-white/5 text-center space-y-3">
              <p className="text-sm text-slate-400 font-bold">No hay encuentros activos disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => {
                const primary = match.primaryColor || '#f59e0b';
                const accent = match.accentColor || '#fbbf24';
                const clubName = match.clubName || 'CLUB INSTITUCIONAL';

                return (
                  <div 
                    key={match.id} 
                    className="rounded-3xl border overflow-hidden shadow-2xl flex flex-col justify-between group transition duration-300 hover:scale-[1.01]"
                    style={{ 
                      backgroundColor: '#0c0f17',
                      borderColor: `${accent}60`,
                      boxShadow: `0 10px 35px -8px ${accent}30`
                    }}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={match.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop';
                        }}
                      />
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 text-[10px] font-black uppercase text-white border border-white/15">
                        📅 {match.date}
                      </span>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {/* IDENTIDAD DEL CLUB CON EL COLOR PRINCIPAL Y MANEJO SEGURO DE LOGO */}
                      <div className="space-y-2 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          {match.clubLogo && match.clubLogo.trim() !== '' ? (
                            <img 
                              src={match.clubLogo} 
                              alt="" 
                              className="w-6 h-6 rounded-full object-cover border" 
                              style={{ borderColor: primary }} 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}

                          {(!match.clubLogo || match.clubLogo.trim() === '') && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-black font-black text-[10px]" style={{ backgroundColor: primary }}>
                              ⚽
                            </div>
                          )}

                          <span className="font-luxury text-base font-black uppercase tracking-wide" style={{ color: primary }}>
                            {clubName}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{match.name}</h3>
                        <p className="text-[11px] text-slate-400">🏟️ {match.venue} ({match.city}) · <strong className="text-white">{match.startTime} HS</strong></p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#07070a] border border-white/5 space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-400"><span>Popular General:</span><strong style={{ color: accent }}>${globalPricing.popularGeneral.toLocaleString('es-AR')}</strong></div>
                        <div className="flex justify-between text-slate-400"><span>Platea General:</span><strong style={{ color: accent }}>${globalPricing.plateaGeneral.toLocaleString('es-AR')}</strong></div>
                      </div>

                      {/* BOTÓN CON EL COLOR SECUNDARIO / ACENTO */}
                      <button
                        onClick={() => { window.location.href = `/club/comprar?id=${match.id}`; }}
                        className="w-full py-3.5 text-black font-black uppercase text-xs rounded-xl transition flex items-center justify-center shadow-lg tracking-wider cursor-pointer font-sans hover:brightness-110"
                        style={{ backgroundColor: accent }}
                      >
                        Ver Partido & Comprar 🎟️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}