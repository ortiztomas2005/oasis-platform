'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP, ScrollTrigger } from '@/core/gsap';
import AuroraBackground from '@/components/fx/AuroraBackground';
import GlitchHeading from '@/components/fx/GlitchHeading';
import RevealText from '@/components/fx/RevealText';

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
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedPricing = localStorage.getItem('le_club_global_pricing');
      if (savedPricing) {
        setGlobalPricing(JSON.parse(savedPricing));
      }

      const globalConfig = JSON.parse(localStorage.getItem('oasis_club_config') || localStorage.getItem('le_club_config') || '{}');
      const defaultClubName = globalConfig.clubName || 'CLUB ATLÉTICO';
      const defaultClubLogo = globalConfig.clubLogo || '';
      const defaultPrimaryColor = globalConfig.primaryColor || '#2563eb';
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

  // Encuentros con fade+slide al entrar en viewport.
  useGSAP(
    () => {
      if (!gridRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gridRef.current!.querySelectorAll('.match-card');
        if (cards.length === 0) return;
        gsap.set(cards, { opacity: 0, y: 40, scale: 0.97 });
        const triggers = ScrollTrigger.batch(cards, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08, overwrite: true }),
        });
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: gridRef, dependencies: [matches.length] }
  );

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white font-mono overflow-x-hidden">
      <AuroraBackground />

      {/* HEADER GENERAL DE LA TIQUETERA MULTICLUB */}
      <header className="glass relative z-30 px-4 sm:px-8 py-3 sm:py-0 sm:h-20 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20 font-luxury">
            ⚽
          </div>
          <GlitchHeading className="neon-text font-luxury text-sm font-black text-white tracking-widest uppercase truncate">
            LIVE EXPERIENCE | TICKETERA DEPORTIVA MULTICLUB
          </GlitchHeading>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
          {/* BOTÓN NUEVO: CARNETS DE SOCIO MULTICLUB */}
          <Link
            href="/club/carnet"
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 active:scale-95 text-blue-300 border border-blue-500/40 transition-colors duration-150 ease-out-strong cursor-pointer flex items-center gap-2 shadow-md shadow-blue-500/10"
          >
            <span>🪪</span>
            <span className="hidden sm:inline">Carnets de Socio</span>
          </Link>

          <Link
            href="/club"
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-400 border border-blue-500/30 transition-colors duration-150 ease-out-strong cursor-pointer flex items-center gap-2"
          >
            <span>💳</span>
            <span className="hidden sm:inline">Mi Billetera Club</span>
          </Link>

          <Link
            href="/"
            className="px-3 sm:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 border border-white/10 transition-colors duration-150 ease-out-strong cursor-pointer whitespace-nowrap"
          >
            <span className="sm:hidden">←</span>
            <span className="hidden sm:inline">← Volver a Fiestas (Home)</span>
          </Link>
        </div>
      </header>

      {/* CONTENIDO DE LA CARTELERA */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-8 space-y-10">

        <div className="glass hud-corners relative rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-12 flex flex-col justify-center min-h-[280px] sm:min-h-[320px] group animate-hero-in">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop"
              alt="Estadio"
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out-strong"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/60 to-transparent" />
          </div>

          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider">
              ● CARTELERA OFICIAL MULTICLUB
            </span>
            <RevealText as="h1" type="words" className="block font-luxury text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-wide leading-tight">
              Próximos Encuentros
            </RevealText>
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
            <div className="p-12 rounded-3xl bg-[#0b1120] border border-white/5 text-center space-y-3">
              <p className="text-sm text-slate-400 font-bold">No hay encuentros activos disponibles en este momento.</p>
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => {
                const primary = match.primaryColor || '#2563eb';
                const accent = match.accentColor || '#fbbf24';
                const clubName = match.clubName || 'CLUB INSTITUCIONAL';

                return (
                  <div 
                    key={match.id}
                    className="match-card rounded-3xl border overflow-hidden shadow-2xl flex flex-col justify-between group transition-transform duration-300 ease-out-strong hover:scale-[1.01] active:scale-[0.99]"
                    style={{ 
                      backgroundColor: '#0b1120',
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

                      <div className="p-3 rounded-2xl bg-[#05070d] border border-white/5 space-y-1 text-[11px]">
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