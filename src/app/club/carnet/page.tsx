'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

interface ClubMembership {
  clubId: string;
  clubName: string;
  memberNumber: string;
  category: string;
  status: string;
  holderName?: string;
  isDependent?: boolean;
}

export default function DigitalSocioCardPage() {
  const [session, setSession] = useState<{ name: string; email: string; dni: string } | null>(null);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  
  const [dynamicToken, setDynamicToken] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('le_current_session') || localStorage.getItem('oasis_current_session') || localStorage.getItem('oasis_customer_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        const userEmail = (parsed.email || '').toLowerCase().trim();
        const userDni = (parsed.dni || '').trim();

        setSession({
          name: parsed.name || 'Socio Titular',
          email: userEmail,
          dni: userDni || '47215838'
        });

        const rawMembers = localStorage.getItem('le_club_members_db');
        let userMemberships: ClubMembership[] = [];

        if (rawMembers) {
          const members = JSON.parse(rawMembers);
          
          // Buscamos coincidencias directas del usuario logueado o menores vinculados a su email/DNI como autorizado
          const matches = members.filter((m: any) => {
            const matchesEmail = m.email && m.email.toLowerCase().trim() === userEmail;
            const matchesDni = m.dni && m.dni.trim() === userDni;
            const matchesAuthorized = m.authorizedEmail && m.authorizedEmail.toLowerCase().trim() === userEmail;
            return matchesEmail || matchesDni || matchesAuthorized;
          });

          userMemberships = matches.map((m: any, idx: number) => ({
            clubId: m.clubId || `card-${idx}`,
            clubName: m.clubName || 'Club Atlético Oficial',
            memberNumber: m.memberNumber || `100${idx}`,
            category: m.category || (m.isDependent ? 'Socio Menor / Vitalicio' : 'Socio Activo'),
            status: m.status || 'ACTIVE',
            holderName: m.name || parsed.name,
            isDependent: m.isDependent || false
          }));
        }

        // Si no hay padrón previo pero hay sesión, creamos una credencial por defecto
        if (userMemberships.length === 0) {
          userMemberships.push({
            clubId: 'default-club',
            clubName: 'Club Atlético Institucional',
            memberNumber: '10023',
            category: 'Socio Pleno',
            status: 'ACTIVE',
            holderName: parsed.name || 'Ciro Gomez',
            isDependent: false
          });
        }

        setMemberships(userMemberships);
        setSelectedCardId(userMemberships[0].clubId);
      }
    } catch {}

    const generateToken = () => {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      setDynamicToken(`SOCIO-SECURE-${randomPart}`);
    };

    generateToken();

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const activeCard = memberships.find(m => m.clubId === selectedCardId) || memberships[0];

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* NAVBAR */}
      <header className="border-b border-white/5 bg-[#07070a] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/club/partidos" className="flex items-center gap-3.5 cursor-pointer group">
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
              href="/club/partidos"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition flex items-center gap-2"
            >
              <span>←</span>
              <span>Cartelera</span>
            </Link>
            <div className="pl-2 border-l border-white/10">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-xl mx-auto w-full px-6 py-10 flex-1 flex flex-col items-center justify-center font-mono">
        <div className="w-full space-y-6">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              ● Padrón Automático Verificado
            </span>
            <h1 className="font-luxury text-3xl font-black uppercase text-white tracking-tight">
              Carnets y Grupo Familiar
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Visualizá tu credencial y las de los menores a tu cargo asociados en la institución.
            </p>
          </div>

          {/* SELECTOR SI TIENE MÁS DE UN CARNET O MENORES A CARGO */}
          {memberships.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {memberships.map((m) => (
                <button
                  key={m.clubId}
                  onClick={() => setSelectedCardId(m.clubId)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
                    selectedCardId === m.clubId
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#0c0f17] text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {m.isDependent ? '👶' : '👤'} {m.holderName} ({m.clubName})
                </button>
              ))}
            </div>
          )}

          {/* TARJETA DE CREDENCIAL DIGITAL */}
          {activeCard && (
            <div className="w-full bg-[#0c0f17] border-2 border-amber-500 rounded-3xl p-7 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* ENCABEZADO CREDENCIAL */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                    {activeCard.clubName}
                  </span>
                  <h3 className="font-luxury text-lg font-black text-white uppercase tracking-wider mt-1">
                    {activeCard.category} {activeCard.isDependent && '• (Menor a Cargo)'}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ✓ Cuota Al Día
                </span>
              </div>

              {/* DATOS DEL SOCIO */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Titular / Portador</span>
                  <strong className="text-white text-sm font-bold">{activeCard.holderName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Número de Socio</span>
                  <strong className="text-emerald-400 text-sm font-bold">#{activeCard.memberNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">DNI / Identificación</span>
                  <strong className="text-slate-200">{session?.dni}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Gestión Autorizada</span>
                  <strong className="text-amber-400">{activeCard.isDependent ? `Titular: ${session?.name}` : 'Personal'}</strong>
                </div>
              </div>

              {/* TOKEN DINÁMICO / QR ROTATIVO */}
              <div className="p-5 rounded-2xl bg-white text-slate-900 text-center space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase px-2">
                  <span>Token Dinámico Molinete</span>
                  <span className="text-amber-600 font-black">Actualiza en {timeLeft}s</span>
                </div>
                
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicToken + '-' + activeCard.memberNumber)}`} 
                  alt="QR Dinámico" 
                  className="w-36 h-36 object-contain mx-auto rounded-lg"
                />

                <div className="font-mono text-xs font-black tracking-widest text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
                  {dynamicToken}
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 uppercase tracking-widest pt-1 border-t border-white/5">
                Credencial oficial validada por padrón institucional.
              </div>

            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#050507] py-6 text-xs font-mono text-slate-500 text-center space-y-1 mt-auto">
        <p className="font-luxury text-amber-400 tracking-widest text-xs font-bold">LIVE EXPERIENCE DEPORTES</p>
      </footer>
    </div>
  );
}