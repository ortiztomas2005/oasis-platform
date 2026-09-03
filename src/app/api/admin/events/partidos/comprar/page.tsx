'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface StadiumSector {
  name: string;
  generalPrice: number;
  memberPrice: number;
  capacity: number;
}

export default function PurchaseMatchPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [selectedSector, setSelectedSector] = useState<StadiumSector | null>(null);
  
  const [buyerType, setBuyerType] = useState<'GENERAL' | 'MEMBER'>('GENERAL');
  const [buyerData, setBuyerData] = useState({ name: '', dni: '', memberNumber: '', email: '' });
  const [purchaseSuccess, setPurchaseSuccess] = useState<any | null>(null);

  useEffect(() => {
    try {
      const storedMatches = JSON.parse(localStorage.getItem('le_club_matches') || '[]');
      if (storedMatches.length > 0) {
        setMatches(storedMatches);
        setSelectedMatch(storedMatches[0]);
        if (storedMatches[0]?.sectors?.[0]) {
          setSelectedSector(storedMatches[0].sectors[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerData.name || !buyerData.dni || !buyerData.email) {
      alert('Por favor completá tus datos personales.');
      return;
    }

    if (buyerType === 'MEMBER' && !buyerData.memberNumber) {
      alert('Por favor ingresá tu número de carnet o socio.');
      return;
    }

    let finalPrice = selectedSector?.generalPrice || 0;
    if (buyerType === 'MEMBER') {
      const membersDb = JSON.parse(localStorage.getItem('le_club_members_db') || '[]');
      const isValidMember = membersDb.find(
        (m: any) => m.dni === buyerData.dni || m.memberNumber === buyerData.memberNumber
      );

      if (!isValidMember) {
        alert('⚠️ No se encontró tu DNI o Nro de socio en el padrón oficial. Se aplicará tarifa general.');
      } else if (isValidMember.status === 'INACTIVE') {
        alert('⚠️ Tu carnet registra cuotas pendientes (Moroso).');
      } else {
        finalPrice = selectedSector?.memberPrice ?? 0;
      }
    }

    const issuedTicket = {
      id: `ticket-${Date.now()}`,
      eventName: selectedMatch.name,
      matchDate: selectedMatch.date,
      startTime: selectedMatch.startTime,
      venue: selectedMatch.venue,
      gateAccess: selectedMatch.gateAccess,
      tierName: `${selectedSector?.name} (${buyerType === 'MEMBER' ? 'Socio' : 'General'})`,
      price: finalPrice,
      holderName: buyerData.name,
      holderDni: buyerData.dni,
      email: buyerData.email.toLowerCase().trim(),
      qrToken: 'STAD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'VALID',
      purchasedAt: new Date().toISOString()
    };

    const existingTickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
    localStorage.setItem('oasis_issued_tickets', JSON.stringify([issuedTicket, ...existingTickets]));

    setPurchaseSuccess(issuedTicket);
  };

  const handlePrintTicket = () => {
    window.print();
  };

  if (!selectedMatch) {
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
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-ticket { border: 2px solid black !important; background: white !important; color: black !important; box-shadow: none !important; }
        }
      `}</style>

      {/* HEADER PÚBLICO */}
      <header className="h-16 border-b border-white/5 bg-[#07070a] px-6 flex items-center justify-between shrink-0 z-30 no-print">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg">
            ⚽
          </div>
          <span className="font-luxury text-sm font-black text-white tracking-widest uppercase">
            ADQUISICIÓN DE PASES DIGITALES
          </span>
        </div>
        <Link href="/events/partidos" className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-300 border border-white/10 text-xs font-bold">
          ← Volver a Cartelera
        </Link>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-8">
        
        {purchaseSuccess ? (
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#0c0f17] border border-amber-500/40 text-center space-y-6 shadow-2xl print-ticket">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black no-print">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="font-luxury text-xl font-black uppercase text-amber-400">¡Pase Digital Emitido!</h2>
              <p className="text-xs text-slate-400">Presentá este código QR o tu DNI en los molinetes del estadio.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#07070a] border border-white/10 text-xs space-y-3 text-left font-mono">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Encuentro:</span>
                <strong className="text-white text-right">{purchaseSuccess.eventName}</strong>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Titular:</span><strong className="text-white">{purchaseSuccess.holderName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">DNI:</span><strong className="text-white">{purchaseSuccess.holderDni}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">Ubicación:</span><strong className="text-amber-400">{purchaseSuccess.tierName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">Acceso:</span><strong className="text-emerald-400">{purchaseSuccess.gateAccess}</strong></div>
              
              {/* CÓDIGO QR VISUAL */}
              <div className="pt-4 border-t border-white/10 text-center space-y-2">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center text-black font-black text-xs shadow-inner">
                  [ QR CODE ]<br/>{purchaseSuccess.qrToken}
                </div>
                <span className="text-[10px] text-slate-500 uppercase block">Token Único de Acceso</span>
              </div>
            </div>

            <div className="space-y-2 no-print">
              <button onClick={handlePrintTicket} className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase rounded-xl text-xs cursor-pointer shadow-lg">
                Imprimir o Guardar PDF 🖨️
              </button>
              <button onClick={() => setPurchaseSuccess(null)} className="w-full py-3 bg-white/5 text-slate-300 rounded-xl text-xs font-bold border border-white/10 cursor-pointer">
                Adquirir Otro Pase
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="p-8 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-6 shadow-xl text-xs">
            <h3 className="font-luxury text-lg font-black uppercase text-white">Comprar / Canjear Entrada para: {selectedMatch.name}</h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBuyerType('GENERAL')}
                className={`py-3 rounded-xl font-bold border transition cursor-pointer ${buyerType === 'GENERAL' ? 'bg-amber-500 text-black border-amber-500' : 'bg-[#07070a] text-slate-300 border-white/10'}`}
              >
                Público General 🎟️
              </button>
              <button
                type="button"
                onClick={() => setBuyerType('MEMBER')}
                className={`py-3 rounded-xl font-bold border transition cursor-pointer ${buyerType === 'MEMBER' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-[#07070a] text-slate-300 border-white/10'}`}
              >
                Soy Socio (Canje/Desc.) ⭐
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 uppercase font-bold text-[10px]">Seleccionar Sector del Estadio</label>
              <div className="grid grid-cols-2 gap-3">
                {(selectedMatch.sectors || []).map((sec: StadiumSector, idx: number) => {
                  const priceToShow = buyerType === 'MEMBER' ? sec.memberPrice : sec.generalPrice;
                  const isSelected = selectedSector?.name === sec.name;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSector(sec)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${isSelected ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-[#07070a] border-white/10 text-slate-400'}`}
                    >
                      <span className="font-bold text-sm text-white">{sec.name}</span>
                      <span className="text-amber-400 font-black text-base">
                        {priceToShow === 0 ? 'FREE (Canje)' : `$${priceToShow.toLocaleString('es-AR')}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-luxury text-sm font-bold text-white uppercase border-b border-white/5 pb-2">Datos del Asistente</h4>
              
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre y Apellido</label>
                <input type="text" required placeholder="Ej: Juan Pérez" value={buyerData.name} onChange={e => setBuyerData({...buyerData, name: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-bold text-[10px]">DNI</label>
                  <input type="text" required placeholder="35123456" value={buyerData.dni} onChange={e => setBuyerData({...buyerData, dni: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
                </div>
                {buyerType === 'MEMBER' && (
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Nro de Carnet / Socio</label>
                    <input type="text" required placeholder="10023" value={buyerData.memberNumber} onChange={e => setBuyerData({...buyerData, memberNumber: e.target.value})} className="w-full p-3 bg-[#07070a] border border-amber-500/40 rounded-xl text-amber-400 font-bold" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-bold text-[10px]">Correo Electrónico</label>
                <input type="email" required placeholder="correo@asistente.com" value={buyerData.email} onChange={e => setBuyerData({...buyerData, email: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-2xl transition shadow-xl cursor-pointer tracking-wider">
              {buyerType === 'MEMBER' ? 'Confirmar Canje Digital ⭐' : `Pagar y Emitir Entrada ($${(selectedSector?.generalPrice || 0).toLocaleString('es-AR')}) 🚀`}
            </button>
          </form>
        )}

      </main>
    </div>
  );
}