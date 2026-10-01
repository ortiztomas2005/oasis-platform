'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TicketQrCard from '@/components/TicketQrCard';
import { gsap, useGSAP, ScrollTrigger } from '@/core/gsap';
import AuroraBackground from '@/components/fx/AuroraBackground';
import RevealText from '@/components/fx/RevealText';

interface TicketItem {
  id: string;
  isSport?: boolean;
  eventName: string;
  tierName: string;
  price: number;
  holderName: string;
  holderDni: string;
  qrToken: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  purchasedAt: string;
  clubName?: string;
}

interface ClubAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  date: string;
}

export default function ClubWalletPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [clubName, setClubName] = useState('CLUB ATLÉTICO');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [accentColor, setAccentColor] = useState('#fbbf24');
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const foldersRef = useRef<HTMLDivElement>(null);

  const loadWalletData = () => {
    try {
      const config = JSON.parse(localStorage.getItem('oasis_club_config') || localStorage.getItem('le_club_config') || '{}');
      const defaultClub = config.clubName || config.name || 'CLUB ATLÉTICO';
      if (defaultClub) setClubName(defaultClub);
      if (config.primaryColor) setPrimaryColor(config.primaryColor);
      if (config.accentColor) setAccentColor(config.accentColor);

      const storedTickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
      
      const sportTickets = storedTickets.filter((t: TicketItem) => {
        const token = (t.qrToken || t.id || '').toUpperCase();
        return t.isSport || token.startsWith('SPORT-') || token.startsWith('CASH-') || token.startsWith('BOX-');
      }).map((t: TicketItem) => ({
        ...t,
        clubName: t.clubName || defaultClub
      }));

      setTickets(sportTickets);

      const folders: Record<string, boolean> = {};
      sportTickets.forEach((t: TicketItem) => {
        const folderKey = t.clubName || defaultClub;
        folders[folderKey] = true;
      });
      setExpandedFolders(folders);

      const storedAnnouncements = JSON.parse(localStorage.getItem('le_club_announcements') || '[]');
      setAnnouncements(storedAnnouncements);

      const storedDismissed = JSON.parse(localStorage.getItem('le_club_dismissed_announcements') || '[]');
      setDismissedAnnouncements(storedDismissed);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadWalletData();
    window.addEventListener('storage', loadWalletData);
    return () => window.removeEventListener('storage', loadWalletData);
  }, []);

  const handleDismissAnnouncement = (id: string) => {
    const updatedDismissed = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updatedDismissed);
    localStorage.setItem('le_club_dismissed_announcements', JSON.stringify(updatedDismissed));
  };

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  const groupedTickets = tickets.reduce((acc: Record<string, TicketItem[]>, ticket) => {
    const folderKey = ticket.clubName || clubName;
    if (!acc[folderKey]) {
      acc[folderKey] = [];
    }
    acc[folderKey].push(ticket);
    return acc;
  }, {});

  const activeAnnouncements = announcements.filter(ann => !dismissedAnnouncements.includes(ann.id));

  // Carpetas de pases con fade+slide al entrar en viewport.
  useGSAP(
    () => {
      if (!foldersRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = foldersRef.current!.querySelectorAll('.wallet-folder');
        if (cards.length === 0) return;
        gsap.set(cards, { opacity: 0, y: 32 });
        const triggers = ScrollTrigger.batch(cards, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08, overwrite: true }),
        });
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: foldersRef, dependencies: [tickets.length] }
  );

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white font-mono overflow-x-hidden">
      <AuroraBackground />

      {/* HEADER DE LA BILLETERA */}
      <header className="glass relative z-30 h-20 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-lg font-luxury" style={{ backgroundColor: primaryColor }}>
            ⚽
          </div>
          <span className="font-luxury text-sm font-black text-white tracking-widest uppercase">
            {clubName} | BILLETERA DE SOCIO & DEPORTES
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <Link
            href="/club/partidos"
            className="px-4 py-2 rounded-xl text-black font-black uppercase transition cursor-pointer shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            ⚽ Ver Cartelera de Partidos
          </Link>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition cursor-pointer"
          >
            ← Volver al Sitio
          </Link>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto p-8 space-y-10">
        
        {/* SECCIÓN DE COMUNICADOS Y ANUNCIOS (CON BOTÓN DE CIERRE ✕) */}
        {activeAnnouncements.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-luxury text-sm font-black text-white uppercase tracking-wider">📢 Comunicados Oficiales</h2>
            {activeAnnouncements.map((ann) => (
              <div 
                key={ann.id} 
                className={`p-5 rounded-3xl border space-y-1.5 shadow-xl relative ${
                  ann.type === 'WARNING' ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' :
                  ann.type === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' :
                  'bg-blue-500/10 border-blue-500/40 text-blue-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider pr-8">
                  <span className="flex items-center gap-1.5">
                    {ann.type === 'WARNING' ? '⚠️' : ann.type === 'SUCCESS' ? '✅' : '📢'} {ann.title}
                  </span>
                  <span className="text-[10px] opacity-75">{ann.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{ann.message}</p>
                
                {/* Cruz para descartar notificación */}
                <button
                  onClick={() => handleDismissAnnouncement(ann.id)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/40 hover:bg-black/80 text-slate-300 flex items-center justify-center text-xs font-black transition cursor-pointer"
                  title="Descartar anuncio"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TÍTULO DE MIS PASES */}
        <div className="space-y-2 border-b border-white/10 pb-4 flex justify-between items-end">
          <div>
            <RevealText as="h1" type="words" className="block font-luxury text-2xl font-black text-white uppercase tracking-wider">Mis Pases Deportivos & Entradas</RevealText>
            <p className="text-xs text-slate-400">Organizados por carpetas de cada club o productora emisora.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-blue-400">
            {tickets.length} Pase{tickets.length === 1 ? '' : 's'} deportivos
          </span>
        </div>

        {/* LISTADO AGRUPADO */}
        {tickets.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0b1120] border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-2xl">
              ⚽
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm uppercase">No tenés pases deportivos activos</h3>
              <p className="text-xs text-slate-400">Explorá la cartelera de partidos y adquirí tus entradas o canjes de socio.</p>
            </div>
            <Link
              href="/club/partidos"
              className="inline-block px-6 py-3 text-black font-black uppercase text-xs rounded-xl shadow-lg cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              Ver Partidos Disponibles 🏟️
            </Link>
          </div>
        ) : (
          <div ref={foldersRef} className="space-y-6">
            {Object.entries(groupedTickets).map(([orgNameKey, orgTickets]) => {
              const isExpanded = expandedFolders[orgNameKey] ?? true;

              return (
                <div key={orgNameKey} className="wallet-folder rounded-3xl bg-[#0b1120] border border-white/10 overflow-hidden shadow-2xl transition-all">
                  
                  <div 
                    onClick={() => toggleFolder(orgNameKey)}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-black text-base shadow-md font-luxury" style={{ backgroundColor: primaryColor }}>
                        📂
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Club / Productora Emisora</span>
                        <h2 className="font-luxury text-lg font-black text-white uppercase tracking-wide">
                          {orgNameKey}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-white/5 border border-white/10 text-blue-400">
                        {orgTickets.length} {orgTickets.length === 1 ? 'Pase' : 'Pases'}
                      </span>
                      <span className={`transform transition-transform duration-300 text-slate-400 text-sm ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center bg-[#05070d]/50">
                      {orgTickets.map((ticket) => (
                        <div key={ticket.id} className="w-full flex justify-center pt-6">
                          <TicketQrCard ticket={ticket} />
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}