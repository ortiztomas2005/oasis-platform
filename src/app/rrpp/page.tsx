'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface RRPPMember {
  id: string;
  name: string;
  dni: string;
  code: string; // ej: "franco", "valen"
  phone: string;
  commissionPercentage: number; // Porcentaje ej: 10 para 10%
  active: boolean;
}

interface Ticket {
  id: string;
  eventName: string;
  tierName: string;
  price: number;
  holderName: string;
  holderDni: string;
  purchaseDate: string;
  rrppCode?: string;
  status: string;
}

export default function RRPPPortalPage() {
  const [dniInput, setDniInput] = useState('');
  const [currentRRPP, setCurrentRRPP] = useState<RRPPMember | null>(null);
  const [assignedSales, setAssignedSales] = useState<Ticket[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanDni = dniInput.trim().replace(/\D/g, '');

    try {
      const storedRRPP = localStorage.getItem('oasis_rrpp_members');
      const list: any[] = storedRRPP ? JSON.parse(storedRRPP) : [];
      
      // Normalizar para compatibilidad si venía de monto fijo anterior
      const normalizedList: RRPPMember[] = list.map((r) => ({
        ...r,
        commissionPercentage:
          r.commissionPercentage !== undefined
            ? r.commissionPercentage
            : r.commissionPerTicket
            ? Math.round((r.commissionPerTicket / 15000) * 100) || 10
            : 10,
      }));

      const found = normalizedList.find((r) => r.dni.replace(/\D/g, '') === cleanDni);

      if (!found) {
        setErrorMsg('DNI no registrado en el equipo oficial de RRPP.');
        return;
      }

      setCurrentRRPP(found);
      loadSales(found.code);
    } catch (e) {
      setErrorMsg('Error al verificar credenciales.');
    }
  };

  const loadSales = (code: string) => {
    try {
      const storedTickets = localStorage.getItem('oasis_issued_tickets');
      if (storedTickets) {
        const all: Ticket[] = JSON.parse(storedTickets);
        const mySales = all.filter(
          (t) => t.rrppCode?.toLowerCase() === code.toLowerCase() && t.status !== 'TRANSFERRED'
        );
        setAssignedSales(mySales);
      }
    } catch (e) {}
  };

  const totalTicketsSold = assignedSales.length;
  const totalGrossSales = assignedSales.reduce((acc, t) => acc + (t.price || 0), 0);
  const commissionRate = (currentRRPP?.commissionPercentage || 10) / 100;
  const totalEarnedCommission = Math.round(totalGrossSales * commissionRate);

  const shareLink = currentRRPP
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/events/oasis-sunset?rrpp=${currentRRPP.code}`
    : '';

  const copyToClipboard = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-neutral-800/60 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              O
            </div>
            <div>
              <span className="text-xs font-black tracking-widest uppercase block">OASIS RRPP</span>
              <span className="text-[10px] text-blue-400 font-mono">Portal de Embajadores</span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 font-mono text-xs transition-colors"
          >
            ← Cartelera
          </Link>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8 flex-1 font-mono">
        {!currentRRPP ? (
          /* LOGIN POR DNI */
          <div className="max-w-md mx-auto bg-[#090d16] border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl mx-auto">
              👥
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-black uppercase text-white">Acceso RRPP & Embajadores</h1>
              <p className="text-xs text-neutral-400 font-sans">
                Ingresá tu DNI para consultar tus comisiones en tiempo real y obtener tu link de venta.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-neutral-400 uppercase font-bold">DNI del RRPP</label>
                <input
                  type="text"
                  placeholder="Ej: 42981332"
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Ingresar a mi Panel →
              </button>
            </form>
          </div>
        ) : (
          /* DASHBOARD */
          <div className="space-y-8 animate-fade-in">
            {/* CABECERA PERFIL RRPP */}
            <div className="bg-[#090d16] border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-600/30">
                  {currentRRPP.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black uppercase text-white">{currentRRPP.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      RRPP ACTIVO
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Código: <strong className="text-indigo-400 font-mono">@{currentRRPP.code}</strong> · Comisión acordada:{' '}
                    <strong className="text-emerald-400 font-bold">{currentRRPP.commissionPercentage}% por venta</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentRRPP(null)}
                className="text-xs text-neutral-500 hover:text-rose-400 font-bold uppercase transition-colors"
              >
                Cerrar Sesión ✕
              </button>
            </div>

            {/* LINK DE VENTA */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-[#090d16] to-[#090d16] border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block">
                  ● Tu Enlace de Venta con Atribución
                </span>
                {copiedCode && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/40">
                    ✓ Link copiado
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 font-mono outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap"
                >
                  📋 Copiar Link
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `¡Hola! Conseguí tus entradas oficiales para OASIS con mi link de embajador acá: ${shareLink}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>WhatsApp</span> 📲
                </a>
              </div>
            </div>

            {/* MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#090d16] border border-neutral-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 font-bold block">Pases Vendidos</span>
                <span className="text-2xl font-black text-white">{totalTicketsSold}</span>
                <span className="text-[10px] text-neutral-500 block">Con tu código @{currentRRPP.code}</span>
              </div>
              <div className="bg-[#090d16] border border-neutral-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 font-bold block">
                  Comisión Ganada ({currentRRPP.commissionPercentage}%)
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  ${totalEarnedCommission.toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-emerald-500/80 block">A liquidar por productora</span>
              </div>
              <div className="bg-[#090d16] border border-neutral-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 font-bold block">Facturación Bruta Generada</span>
                <span className="text-2xl font-black text-indigo-400">
                  ${totalGrossSales.toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-neutral-500 block">Monto total pagado por tus clientes</span>
              </div>
            </div>

            {/* HISTORIAL DETALLADO CON CÁLCULO PORCENTUAL */}
            <div className="bg-[#090d16] border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider border-b border-neutral-800 pb-3">
                Historial de Entradas Vendidas ({assignedSales.length})
              </h3>

              {assignedSales.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500">
                  Aún no registrás ventas con tu enlace. ¡Compartilo en tus historias y grupos de WhatsApp!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] text-neutral-500 uppercase">
                        <th className="pb-3">Comprador</th>
                        <th className="pb-3">Evento & Tanda</th>
                        <th className="pb-3">Fecha Compra</th>
                        <th className="pb-3">Precio Entrada</th>
                        <th className="pb-3 text-right">Tu Comisión ({currentRRPP.commissionPercentage}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {assignedSales.map((sale) => {
                        const itemCommission = Math.round((sale.price || 0) * commissionRate);

                        return (
                          <tr key={sale.id} className="hover:bg-white/[0.02]">
                            <td className="py-3">
                              <span className="font-bold text-white uppercase block">{sale.holderName}</span>
                              <span className="text-neutral-500 text-[10px]">DNI: {sale.holderDni}</span>
                            </td>
                            <td className="py-3">
                              <span className="text-neutral-300 block">{sale.eventName}</span>
                              <span className="text-blue-400 text-[10px]">{sale.tierName}</span>
                            </td>
                            <td className="py-3 text-neutral-400 text-[11px]">
                              {new Date(sale.purchaseDate).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 font-bold text-white">${sale.price.toLocaleString('es-AR')}</td>
                            <td className="py-3 text-right font-black text-emerald-400">
                              +${itemCommission.toLocaleString('es-AR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-800/60 py-6 text-center text-[10px] text-neutral-500 font-mono">
        © 2026 OASIS Platform · Red Oficial de RRPP & Embajadores
      </footer>
    </div>
  );
}