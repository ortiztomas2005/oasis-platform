'use client';

import React, { useState, useEffect } from 'react';

const COLOR_THEMES = [
  { id: 'amber', name: 'Oro Clásico (Oasis)', primary: 'from-amber-500 to-yellow-400', border: 'border-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'emerald', name: 'Verde Institucional', primary: 'from-emerald-500 to-teal-400', border: 'border-emerald-500/40', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'blue', name: 'Azul Deportivo', primary: 'from-blue-500 to-indigo-500', border: 'border-blue-500/40', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'rose', name: 'Rojo Furia', primary: 'from-rose-500 to-red-600', border: 'border-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-500/10' },
];

export default function ClubThemeSettings() {
  const [selectedTheme, setSelectedTheme] = useState('amber');

  useEffect(() => {
    const saved = localStorage.getItem('oasis_club_qr_theme');
    if (saved) setSelectedTheme(saved);
  }, []);

  const handleSaveTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('oasis_club_qr_theme', themeId);
    // Disparamos evento para que otras pestañas o componentes se actualicen al instante
    window.dispatchEvent(new Event('storage'));
    alert('¡Tema visual del club actualizado con éxito!');
  };

  return (
    <div className="p-6 rounded-3xl bg-[#0c0f16] border border-white/10 space-y-6 font-mono">
      <div className="space-y-1">
        <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
          ● Configuración de Identidad
        </span>
        <h3 className="text-xl font-black uppercase text-white font-luxury">
          Color de los Pases y QR del Club
        </h3>
        <p className="text-xs text-slate-400 font-sans">
          Elegí la paleta cromática oficial con la que se visualizarán los accesos a los partidos en la sección de deportes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COLOR_THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleSaveTheme(theme.id)}
              className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                isSelected
                  ? `${theme.border} ${theme.bg} shadow-lg`
                  : 'border-white/5 bg-[#07070a] hover:bg-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${theme.primary} shadow-md`} />
                <div>
                  <div className={`text-xs font-bold uppercase ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {theme.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isSelected ? 'Tema activo actual' : 'Hacer clic para activar'}
                  </div>
                </div>
              </div>
              {isSelected && <span className="text-amber-400 font-bold text-sm">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}