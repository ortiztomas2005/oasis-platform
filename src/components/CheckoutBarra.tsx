'use client';

import React, { useState } from 'react';

interface Props {
  totalPrecio: number;
  totalItems: number;
  onVolver: () => void;
}

export default function CheckoutBarra({ totalPrecio, totalItems, onVolver }: Props) {
  const [paso, setPaso] = useState<'datos' | 'qr'>('datos');
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');

  const procesarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !dni || !email) return;
    setPaso('qr');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-md mx-auto border-x border-zinc-900">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 pt-2">
        <button
          onClick={onVolver}
          className="text-xs font-mono text-zinc-400 hover:text-yellow-400"
        >
          ← VOLVER AL MENÚ
        </button>
        <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-widest">
          • CHECKOUT OASIS
        </span>
      </div>

      {paso === 'datos' ? (
        <div className="mt-6 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">RESUMEN DE COMPRA</span>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-300">{totalItems} CONSUMIBLES</span>
              <span className="text-lg font-mono font-bold text-yellow-400">${totalPrecio.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <form onSubmit={procesarPago} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">DATOS PARA EL RETIRO</h2>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">NOMBRE COMPLETO</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl text-sm focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">DNI (TITULAR)</label>
              <input
                type="number"
                placeholder="Ej: 40123456"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl text-sm focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">EMAIL (DONDE RECIBÍS EL TICKET)</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl text-sm focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black p-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-yellow-400/10"
            >
              PAGAR CON MERCADO PAGO (${totalPrecio.toLocaleString('es-AR')})
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-6 text-center space-y-6">
          <div className="bg-zinc-950 border border-yellow-400/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full inline-block mb-4">
              ✓ PAGO APROBADO
            </div>

            <h2 className="text-xl font-black text-yellow-400 tracking-wider uppercase mb-1">
              TICKET DIGITAL DE BARRA
            </h2>
            <p className="text-xs text-zinc-400 font-mono">Presentá este código en barra para retirar</p>

            <div className="my-6 bg-white p-4 rounded-2xl inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=OASIS-BARRA-${dni}-${Date.now()}`}
                alt="Código QR de Retiro"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="border-t border-zinc-900 pt-4 text-left space-y-1 font-mono text-xs">
              <p className="text-zinc-500">TITULAR: <span className="text-white font-bold">{nombre.toUpperCase()}</span></p>
              <p className="text-zinc-500">DNI: <span className="text-white font-bold">{dni}</span></p>
              <p className="text-zinc-500">ITEMS: <span className="text-yellow-400 font-bold">{totalItems} CONSUMIBLES</span></p>
            </div>
          </div>

          <button
            onClick={onVolver}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs p-3.5 rounded-xl border border-zinc-800"
          >
            VOLVER AL INICIO
          </button>
        </div>
      )}

    </div>
  );
}