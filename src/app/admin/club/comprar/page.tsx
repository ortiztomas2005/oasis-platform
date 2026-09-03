'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ClubCheckoutContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id') || 'm-1';

  const [match, setMatch] = useState<any>(null);
  const [globalPricing, setGlobalPricing] = useState({
    popularGeneral: 12000,
    popularMember: 0,
    popularSpecial: 6000,
    plateaGeneral: 25000,
    plateaMember: 15000,
    plateaSpecial: 12000,
    specialLabel: 'Menores / Jubilados'
  });

  const [selectedSector, setSelectedSector] = useState<'popular' | 'platea'>('popular');
  const [ticketCategory, setTicketCategory] = useState<'general' | 'member' | 'special'>('general');
  const [quantity, setQuantity] = useState<number>(1);

  const [holderName, setHolderName] = useState<string>('');
  const [holderDni, setHolderDni] = useState<string>('');
  const [holderEmail, setHolderEmail] = useState<string>('');
  const [memberNumber, setMemberNumber] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedPricing = localStorage.getItem('le_club_global_pricing');
      if (savedPricing) {
        setGlobalPricing(JSON.parse(savedPricing));
      }

      const storedMatches = JSON.parse(localStorage.getItem('le_club_matches') || '[]');
      const found = storedMatches.find((m: any) => m.id === matchId) || {
        id: matchId,
        name: 'CLUB ATLÉTICO VS RIVAL HISTÓRICO',
        date: 'Sábado 15 de Septiembre',
        startTime: '19:00',
        venue: 'Estadio Monumental',
        city: 'Buenos Aires',
        imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop'
      };
      setMatch(found);

      const session = JSON.parse(
        localStorage.getItem('le_current_session') || 
        localStorage.getItem('oasis_current_session') || '{}'
      );
      if (session && session.email) {
        setHolderName(session.name || '');
        setHolderEmail(session.email.toLowerCase().trim());
        setHolderDni(session.dni || '');
        if (session.memberNumber) setMemberNumber(session.memberNumber);
      }
    } catch (e) {
      console.error(e);
    }
  }, [matchId]);

  const getUnitPrice = () => {
    if (selectedSector === 'popular') {
      if (ticketCategory === 'member') return globalPricing.popularMember;
      if (ticketCategory === 'special') return globalPricing.popularSpecial;
      return globalPricing.popularGeneral;
    } else {
      if (ticketCategory === 'member') return globalPricing.plateaMember;
      if (ticketCategory === 'special') return globalPricing.plateaSpecial;
      return globalPricing.plateaGeneral;
    }
  };

  const unitPrice = getUnitPrice();
  const subtotal = unitPrice * quantity;

  // VERIFICACIÓN CONTRA EL PADRÓN DE SOCIOS CARGADO EN EL SISTEMA
  const validateMemberAgainstDatabase = () => {
    if (ticketCategory !== 'member') return true;

    if (!memberNumber.trim() || !holderDni.trim()) {
      alert('Debes ingresar tu número de socio y DNI para validar el canje.');
      return false;
    }

    try {
      const rawMembers = 
        localStorage.getItem('oasis_club_members') || 
        localStorage.getItem('le_club_members') || 
        localStorage.getItem('club_members_list') || '[]';
      
      const membersList = JSON.parse(rawMembers);

      if (!Array.isArray(membersList) || membersList.length === 0) {
        // Si no hay padrón cargado todavía, dejamos pasar en modo de prueba pero avisamos por consola
        console.warn('⚠️ No se encontró padrón de socios cargado en localStorage. Permitido temporalmente.');
        return true;
      }

      // Buscamos si el socio existe en la lista subida (por número de socio o DNI)
      const found = membersList.find((m: any) => {
        const mNum = String(m.memberNumber || m.numeroSocio || m.id || '').trim().toLowerCase();
        const mDni = String(m.dni || m.documento || '').trim();
        const inputNum = memberNumber.trim().toLowerCase();
        const inputDni = holderDni.trim();

        return (mNum === inputNum || mDni === inputDni);
      });

      if (!found) {
        alert('❌ Validación fallida: El número de socio o DNI ingresado no figura en el padrón oficial de socios.');
        return false;
      }

      if (found.status && found.status !== 'ACTIVE' && found.status !== 'ACTIVO') {
        alert('❌ Tu cuenta de socio registra estado inactivo o cuotas adeudadas.');
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      alert('Error al verificar el padrón de socios.');
      return false;
    }
  };

  const handleConfirmPurchase = () => {
    if (!holderName || !holderDni || !holderEmail) return alert('Por favor completá los datos del titular.');
    if (ticketCategory === 'member' && !memberNumber) return alert('Ingresá tu número de socio para validar el canje.');
    if (!acceptedTerms) return alert('Debes aceptar las condiciones generales.');

    // Ejecutamos la validación contra el padrón de socios antes de avanzar
    if (ticketCategory === 'member') {
      const isValid = validateMemberAgainstDatabase();
      if (!isValid) return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const newTickets = [];
        for (let i = 0; i < quantity; i++) {
          newTickets.push({
            id: `tkt-sport-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            eventId: match?.id,
            eventName: match?.name,
            tierName: `${selectedSector.toUpperCase()} - ${ticketCategory.toUpperCase()}`,
            price: unitPrice,
            holderName: holderName.trim(),
            holderDni: holderDni.trim(),
            holderEmail: holderEmail.toLowerCase().trim(),
            memberNumber: ticketCategory === 'member' ? memberNumber : null,
            qrToken: 'SPORT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            status: 'VALID',
            purchaseDate: new Date().toISOString()
          });
        }

        const existing = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
        localStorage.setItem('oasis_issued_tickets', JSON.stringify([...newTickets, ...existing]));

        setIsProcessing(false);
        window.dispatchEvent(new Event('storage'));
        alert(`¡Operación exitosa! Se han emitido ${quantity} acceso(s) deportivo(s) a tu Billetera.`);
        window.location.href = '/my-tickets';
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
        alert('Error al procesar la entrada.');
      }
    }, 1000);
  };

  if (!match) return <div className="min-h-screen bg-[#07070a] text-white p-10 font-mono">Cargando encuentro...</div>;

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black font-mono">
      <header className="h-20 border-b border-white/10 bg-[#07070a] px-8 flex items-center justify-between shrink-0 z-30">
        <Link href="/admin/club/partidos" className="flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400 transition">
          ← Volver a Cartelera de Deportes
        </Link>
        <span className="font-luxury text-xs font-black text-amber-400 tracking-widest uppercase">
          OASIS CLUB | CHECKOUT OFICIAL
        </span>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">1. Seleccioná el Sector</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedSector('popular')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer space-y-1 ${selectedSector === 'popular' ? 'bg-amber-500/15 border-amber-500 text-white' : 'bg-[#07070a] border-white/5 text-slate-400 hover:border-white/20'}`}
              >
                <span className="font-bold text-sm block">Popular</span>
                <span className="text-[10px] block opacity-75">Tribuna general sin numerar</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSector('platea')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer space-y-1 ${selectedSector === 'platea' ? 'bg-amber-500/15 border-amber-500 text-white' : 'bg-[#07070a] border-white/5 text-slate-400 hover:border-white/20'}`}
              >
                <span className="font-bold text-sm block">Platea</span>
                <span className="text-[10px] block opacity-75">Ubicación preferencial numerada</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">2. Categoría de Acceso</h3>
            <div className="space-y-3">
              <label 
                onClick={() => setTicketCategory('member')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${ticketCategory === 'member' ? 'bg-emerald-500/10 border-emerald-500/50 text-white' : 'bg-[#07070a] border-white/5 text-slate-400'}`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" name="cat" checked={ticketCategory === 'member'} onChange={() => setTicketCategory('member')} className="accent-emerald-500" />
                  <div>
                    <span className="font-bold text-xs block text-white">Canje de Socio 🟢 (Verificación en Padrón)</span>
                    <span className="text-[10px] text-slate-400">Exclusivo masa societaria al día</span>
                  </div>
                </div>
                <span className="font-black text-emerald-400 text-sm">
                  {selectedSector === 'popular' ? (globalPricing.popularMember === 0 ? 'FREE' : `$${globalPricing.popularMember}`) : `$${globalPricing.plateaMember}`}
                </span>
              </label>

              <label 
                onClick={() => setTicketCategory('general')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${ticketCategory === 'general' ? 'bg-amber-500/10 border-amber-500/50 text-white' : 'bg-[#07070a] border-white/5 text-slate-400'}`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" name="cat" checked={ticketCategory === 'general'} onChange={() => setTicketCategory('general')} className="accent-amber-500" />
                  <div>
                    <span className="font-bold text-xs block text-white">Entrada General</span>
                    <span className="text-[10px] text-slate-400">Público general / No socios</span>
                  </div>
                </div>
                <span className="font-black text-amber-400 text-sm">
                  ${selectedSector === 'popular' ? globalPricing.popularGeneral.toLocaleString('es-AR') : globalPricing.plateaGeneral.toLocaleString('es-AR')}
                </span>
              </label>
            </div>
          </div>

          <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">3. Datos del Asistente</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nombre y Apellido</label>
                <input type="text" value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Ej: Ciro Gomez" className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white text-xs font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">DNI</label>
                  <input type="text" value={holderDni} onChange={(e) => setHolderDni(e.target.value)} placeholder="35123456" className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white text-xs font-bold" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Email (Billetera)</label>
                  <input type="email" value={holderEmail} onChange={(e) => setHolderEmail(e.target.value)} placeholder="correo@mail.com" className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white text-xs font-bold" />
                </div>
              </div>
              {ticketCategory === 'member' && (
                <div>
                  <label className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">Número de Socio 🟢</label>
                  <input type="text" value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} placeholder="Ej: SOC-98421" className="w-full px-4 py-3 bg-[#07070a] border border-emerald-500/40 rounded-xl text-white text-xs font-bold" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-6 sticky top-24">
          <div className="border-b border-white/10 pb-4 space-y-1">
            <h4 className="text-white font-bold text-sm">Resumen del Encuentro</h4>
            <p className="text-xs text-amber-400 font-bold">{match.name}</p>
            <p className="text-[10px] text-slate-400">📅 {match.date} · 🏟️ {match.venue}</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Sector: <strong className="text-white uppercase">{selectedSector}</strong></span>
              <span className="text-slate-300">Tipo: <strong className="text-amber-400 uppercase">{ticketCategory}</strong></span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-slate-400">Cantidad</span>
              <div className="flex items-center gap-3 bg-[#07070a] border border-white/10 rounded-full px-3 py-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-white font-black hover:text-amber-400 cursor-pointer">−</button>
                <span className="w-4 text-center font-bold text-white">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-white font-black hover:text-amber-400 cursor-pointer">+</button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
            <span className="text-sm font-bold text-white">Total a abonar</span>
            <div className="text-right">
              <span className="text-3xl font-black text-amber-400">${subtotal.toLocaleString('es-AR')}</span>
              <span className="text-[9px] text-slate-500 block uppercase">ARS</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
            <label htmlFor="terms" className="text-xs text-slate-300 cursor-pointer">
              Acepto las <span className="text-amber-400 underline">condiciones generales de acceso al estadio</span>
            </label>
          </div>

          <button
            onClick={handleConfirmPurchase}
            disabled={isProcessing}
            className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-2xl transition cursor-pointer shadow-xl shadow-amber-500/20 tracking-wider disabled:opacity-50"
          >
            {isProcessing ? 'Procesando...' : (unitPrice === 0 ? '🟢 Validar Padrón y Canjear Gratis' : '🔒 Validar y Pagar')}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ClubCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070a] text-white p-10 font-mono">Cargando checkout...</div>}>
      <ClubCheckoutContent />
    </Suspense>
  );
}