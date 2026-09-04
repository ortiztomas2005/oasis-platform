'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ClubCheckoutPage() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id');

  const [match, setMatch] = useState<any>(null);
  const [selectedSector, setSelectedSector] = useState<any>(null);
  const [accessType, setAccessType] = useState<'general' | 'member'>('general');
  const [quantity, setQuantity] = useState(1);
  const [holderName, setHolderName] = useState('');
  const [holderDni, setHolderDni] = useState('');
  const [holderMemberNumber, setHolderMemberNumber] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Colores institucionales del club
  const [clubColors, setClubColors] = useState({
    primary: '#f59e0b',
    accent: '#fbbf24'
  });

  useEffect(() => {
    try {
      const globalConfig = JSON.parse(localStorage.getItem('oasis_club_config') || localStorage.getItem('le_club_config') || '{}');
      
      const storedMatches = JSON.parse(localStorage.getItem('le_club_matches') || '[]');
      const foundMatch = storedMatches.find((m: any) => m.id === matchId) || storedMatches[0] || {
        id: 'm-1',
        clubName: globalConfig.clubName || 'CLUB ATLÉTICO',
        primaryColor: globalConfig.primaryColor || '#f59e0b',
        accentColor: globalConfig.accentColor || '#fbbf24',
        name: 'ENCUENTRO OFICIAL',
        date: '2026-09-15',
        startTime: '19:00',
        venue: 'Estadio Principal',
        sectors: [
          { name: 'Popular', generalPrice: 12000, memberPrice: 0, capacity: 15000 },
          { name: 'Platea', generalPrice: 25000, memberPrice: 15000, capacity: 5000 }
        ]
      };

      setMatch(foundMatch);
      
      setClubColors({
        primary: foundMatch.primaryColor || globalConfig.primaryColor || '#f59e0b',
        accent: foundMatch.accentColor || globalConfig.accentColor || '#fbbf24'
      });

      if (foundMatch.sectors && foundMatch.sectors.length > 0) {
        setSelectedSector(foundMatch.sectors[0]);
      }

      const sessionRaw = localStorage.getItem('le_current_session') || localStorage.getItem('oasis_current_session');
      if (sessionRaw) {
        const s = JSON.parse(sessionRaw);
        if (s.name) setHolderName(s.name);
        if (s.dni) setHolderDni(s.dni);
        if (s.email) setHolderEmail(s.email);
        if (s.memberNumber) setHolderMemberNumber(s.memberNumber);
      }
    } catch (e) {
      console.error(e);
    }
  }, [matchId]);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center font-mono">
        <p className="text-sm">Cargando encuentro...</p>
      </div>
    );
  }

  const unitPrice = accessType === 'member' ? (selectedSector?.memberPrice || 0) : (selectedSector?.generalPrice || 12000);
  const totalPrice = unitPrice * quantity;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Debes aceptar las condiciones generales de acceso.');
      return;
    }
    if (!holderName || !holderDni || !holderEmail) {
      alert('Por favor completá todos los datos del asistente.');
      return;
    }

    // Validación si elige Canje de Socio contra el padrón
    if (accessType === 'member') {
      if (!holderMemberNumber.trim()) {
        alert('Por favor ingresá tu Número de Socio para validar el canje.');
        return;
      }

      try {
        const membersDb = JSON.parse(localStorage.getItem('oasis_club_members') || localStorage.getItem('le_club_members_db') || '[]');
        if (membersDb.length > 0) {
          const found = membersDb.find((m: any) => 
            (m.dni && m.dni.trim() === holderDni.trim()) || 
            (m.memberNumber && m.memberNumber.trim() === holderMemberNumber.trim())
          );
          if (!found) {
            alert('⚠️ El DNI o Número de Socio ingresado no se encuentra activo en el padrón de socios del club.');
            return;
          }
          if (found.status && found.status.toUpperCase() === 'INACTIVE') {
            alert('⚠️ Acceso denegado: El socio registra cuotas impagas o padrón inactivo.');
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const newTicket = {
        id: `TKT-SPORT-${Date.now()}`,
        isSport: true,
        eventName: `${match.clubName || 'Club'} vs ${match.name}`,
        tierName: `${selectedSector?.name} (${accessType === 'member' ? `Socio N° ${holderMemberNumber} / Canje` : 'General'})`,
        price: totalPrice,
        holderName: holderName.trim(),
        holderDni: holderDni.trim(),
        holderMemberNumber: holderMemberNumber.trim(),
        holderEmail: holderEmail.trim().toLowerCase(),
        qrToken: 'SPORT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        status: 'VALID',
        purchasedAt: new Date().toISOString()
      };

      const issued = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
      localStorage.setItem('oasis_issued_tickets', JSON.stringify([newTicket, ...issued]));

      alert(`¡Validación exitosa! Tu pase fue emitido y guardado en tu Billetera Deportiva.`);
      window.location.href = '/club';
    } catch (err) {
      console.error(err);
      alert('Error al procesar la entrada.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black font-mono">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* HEADER */}
      <header className="h-20 border-b border-white/10 bg-[#07070a] px-8 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-lg font-luxury" style={{ backgroundColor: clubColors.primary }}>
            ⚽
          </div>
          <span className="font-luxury text-sm font-black text-white tracking-widest uppercase">
            {match.clubName || 'CLUB'} | CHECKOUT OFICIAL
          </span>
        </div>
        
        <Link
          href="/club/partidos"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition cursor-pointer text-xs font-bold"
        >
          ← Volver a Cartelera
        </Link>
      </header>

      {/* CONTENIDO DE CHECKOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: SELECCIÓN */}
        <form onSubmit={handleProcessPayment} className="lg:col-span-7 space-y-8">
          
          {/* 1. SELECCIONAR SECTOR */}
          <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: clubColors.accent }}>
              1. Seleccioná el Sector
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(match.sectors || []).map((sec: any, idx: number) => {
                const isSelected = selectedSector?.name === sec.name;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSector(sec)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-1 ${isSelected ? 'bg-white/5' : 'bg-[#07070a] border-white/5 opacity-60'}`}
                    style={{ borderColor: isSelected ? clubColors.accent : 'rgba(255,255,255,0.08)' }}
                  >
                    <h3 className="font-bold text-white text-sm">{sec.name}</h3>
                    <p className="text-[11px] text-slate-400">Gen: ${sec.generalPrice.toLocaleString('es-AR')} | Socio: {sec.memberPrice === 0 ? 'FREE' : `$${sec.memberPrice}`}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CATEGORÍA DE ACCESO */}
          <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: clubColors.accent }}>
              2. Categoría de Acceso
            </h2>
            <div className="space-y-3">
              <label 
                className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer ${accessType === 'member' ? 'bg-white/5' : 'bg-[#0c0f17] border-white/5 opacity-60'}`}
                style={{ borderColor: accessType === 'member' ? clubColors.accent : 'rgba(255,255,255,0.08)' }}
                onClick={() => setAccessType('member')}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={accessType === 'member'} onChange={() => setAccessType('member')} className="accent-amber-500" />
                  <div>
                    <span className="font-bold text-white text-xs block">Canje de Socio (Verificación en Padrón)</span>
                    <span className="text-[10px] text-slate-400">Exclusivo masa societaria al día</span>
                  </div>
                </div>
                <span className="font-black text-emerald-400 text-xs uppercase">{selectedSector?.memberPrice === 0 ? 'FREE' : `$${selectedSector?.memberPrice}`}</span>
              </label>

              <label 
                className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer ${accessType === 'general' ? 'bg-white/5' : 'bg-[#0c0f17] border-white/5 opacity-60'}`}
                style={{ borderColor: accessType === 'general' ? clubColors.accent : 'rgba(255,255,255,0.08)' }}
                onClick={() => setAccessType('general')}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={accessType === 'general'} onChange={() => setAccessType('general')} className="accent-amber-500" />
                  <div>
                    <span className="font-bold text-white text-xs block">Entrada General</span>
                    <span className="text-[10px] text-slate-400">Público general / No socios</span>
                  </div>
                </div>
                <span className="font-black text-xs uppercase" style={{ color: clubColors.accent }}>${selectedSector?.generalPrice?.toLocaleString('es-AR')}</span>
              </label>
            </div>
          </div>

          {/* 3. DATOS DEL ASISTENTE */}
          <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-4 shadow-xl text-xs">
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: clubColors.accent }}>
              3. Datos del Asistente
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Nombre y Apellido</label>
                <input type="text" required value={holderName} onChange={e => setHolderName(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-bold text-[10px] block mb-1">DNI</label>
                  <input type="text" required value={holderDni} onChange={e => setHolderDni(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
                </div>

                {/* CAMPO CONDICIONAL DE NÚMERO DE SOCIO */}
                {accessType === 'member' && (
                  <div>
                    <label className="text-emerald-400 uppercase font-bold text-[10px] block mb-1">Número de Socio *</label>
                    <input type="text" required placeholder="Ej: 10023" value={holderMemberNumber} onChange={e => setHolderMemberNumber(e.target.value)} className="w-full p-3 bg-[#07070a] border border-emerald-500/50 rounded-xl text-emerald-400 font-bold" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Email (Billetera)</label>
                <input type="email" required value={holderEmail} onChange={e => setHolderEmail(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 text-black font-black uppercase text-xs rounded-2xl shadow-xl cursor-pointer tracking-wider transition hover:brightness-110 lg:hidden"
            style={{ backgroundColor: clubColors.accent }}
          >
            Validar y Pagar 🔒
          </button>

        </form>

        {/* COLUMNA DERECHA: RESUMEN Y PAGO */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="p-6 rounded-3xl bg-[#0c0f17] border space-y-6 shadow-2xl" style={{ borderColor: `${clubColors.accent}50` }}>
            <div className="border-b border-white/10 pb-4 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Resumen del Encuentro</span>
              <h3 className="font-luxury text-base font-black text-white uppercase">{match.name}</h3>
              <p className="text-xs text-slate-400">📅 {match.date} · 🏟️ {match.venue}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Sector:</span>
                <strong className="text-white uppercase">{selectedSector?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo:</span>
                <strong style={{ color: clubColors.accent }}>{accessType.toUpperCase()}</strong>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-slate-400">Cantidad:</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-white/5 text-white font-bold flex items-center justify-center">-</button>
                  <span className="font-bold text-white">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-white/5 text-white font-bold flex items-center justify-center">+</button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase">Total a abonar:</span>
              <span className="text-2xl font-black" style={{ color: clubColors.accent }}>
                ${totalPrice.toLocaleString('es-AR')} <span className="text-[10px] text-slate-400">ARS</span>
              </span>
            </div>

            <label className="flex items-center gap-2.5 text-[11px] text-slate-300 cursor-pointer pt-2">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="accent-amber-500 rounded" />
              <span>Acepto las <strong className="underline">condiciones generales de acceso al estadio</strong></span>
            </label>

            <button
              type="submit"
              onClick={handleProcessPayment}
              className="w-full py-4 text-black font-black uppercase text-xs rounded-2xl shadow-xl cursor-pointer tracking-wider transition hover:brightness-110 hidden lg:flex items-center justify-center gap-2"
              style={{ backgroundColor: clubColors.accent }}
            >
              <span>🔒</span> Validar y Pagar
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}