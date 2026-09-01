'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Sincronizar datos al abrir
  useEffect(() => {
    if (user) {
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
    }
  }, [user, isOpen]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/auth"
        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md shadow-blue-600/30"
      >
        Iniciar Sesión
      </Link>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      email: editEmail,
      phone: editPhone,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="relative font-mono" ref={menuRef}>
      {/* BOTÓN TRIGGER DEL NAVBAR */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white transition-all text-xs"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold uppercase text-[11px]">
          {user.name ? user.name.split(' ')[0] : 'PERFIL'}
        </span>
        <span className="text-[10px] text-neutral-500">▼</span>
      </button>

      {/* DROPDOWN FLOTANTE COMPACTO */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0c101a] border border-neutral-800 rounded-2xl shadow-2xl p-4 z-50 space-y-4 animate-fade-in text-xs">
          {/* HEADER DEL PERFIL */}
          <div className="flex items-center gap-3 border-b border-neutral-800/80 pb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-md">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-black uppercase text-white truncate text-xs">{user.name}</h4>
              <p className="text-[10px] text-blue-400 font-bold">DNI: {user.dni}</p>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-emerald-400 text-[10px] text-center font-bold">
              ✓ Contacto actualizado
            </div>
          )}

          {/* VISTA NORMAL O EDICIÓN */}
          {!isEditing ? (
            <div className="space-y-2">
              <div className="bg-black/40 p-2.5 rounded-xl border border-neutral-800/80 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-[9px] uppercase font-bold">Email</span>
                  <span className="text-neutral-300 truncate max-w-[170px]">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-[9px] uppercase font-bold">Teléfono</span>
                  <span className="text-neutral-300">{user.phone || 'No registrado'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-[10px] font-bold uppercase transition-colors"
                >
                  Editar Contacto ✏️
                </button>
                <Link
                  href="/my-tickets"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-center rounded-xl text-[10px] font-bold uppercase transition-colors"
                >
                  Mis Pases 🎟️
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-2.5 text-[11px]">
              <div>
                <label className="text-[9px] text-neutral-400 uppercase font-bold block mb-0.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] text-neutral-400 uppercase font-bold block mb-0.5">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="w-full bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-1.5 bg-neutral-800 text-neutral-400 rounded-lg text-[10px] font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          {/* FOOTER CERRAR SESIÓN */}
          <div className="border-t border-neutral-800/80 pt-2 flex justify-between items-center">
            <span className="text-[9px] text-neutral-500">DNI Bloqueado</span>
            <button
              type="button"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="text-rose-400 hover:text-rose-300 font-bold text-[10px] uppercase transition-colors"
            >
              Cerrar Sesión ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}