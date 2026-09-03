'use client';

import React from 'react';
import Link from 'next/link';

export default function NavigationHeader() {
  return (
    <header className="h-20 bg-[#07070a] border-b border-white/10 px-8 flex items-center justify-between z-50 font-mono text-slate-100">
      
      {/* LOGO / MARCA */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20 font-luxury">
          LE
        </div>
        <span className="font-luxury text-base font-black tracking-widest text-white uppercase">
          LIVE EXPERIENCE
        </span>
      </div>

      {/* MENÚ DE NAVEGACIÓN SUPERIOR */}
      <div className="flex items-center gap-6 text-xs font-bold">
        
        {/* NUEVO BOTÓN DEPORTE */}
        <Link 
          href="/events/partidos" 
          className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <span>⚽</span> Deporte
        </Link>

        <Link 
          href="/resale" 
          className="text-slate-300 hover:text-white transition px-2 py-1"
        >
          Resale
        </Link>

        <Link 
          href="/barra" 
          className="text-slate-300 hover:text-white transition px-2 py-1"
        >
          Barra
        </Link>

        <Link 
          href="/billetera" 
          className="px-4 py-2 rounded-xl border border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition shadow-md"
        >
          Billetera
        </Link>

        {/* PERFIL DE USUARIO / CIRO */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow">
            C
          </div>
          <span className="text-slate-200">ciro</span>
        </div>

      </div>
    </header>
  );
}