'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/core/auth/useSession';

export default function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return <div className="w-24 h-8 rounded-xl bg-[#161a26] animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs">
        <Link
          href="/auth"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase rounded-xl transition shadow-lg shadow-blue-600/30"
        >
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="relative font-mono text-xs" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#161a26] border border-slate-800 hover:border-slate-700 text-white font-bold transition cursor-pointer"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-[10px]">
          {(user.name || 'U').substring(0, 1).toUpperCase()}
        </div>
        <span className="hidden sm:inline">{user.name || 'Usuario'}</span>
        <span className="text-[10px] text-slate-400">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#121622] border border-slate-800 shadow-2xl py-2 z-50 animate-fade-in">
          <div className="px-4 py-2 border-b border-slate-800/80 mb-1">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Conectado como</span>
            <span className="font-black text-white text-xs truncate block">{user.email}</span>
          </div>

          <Link
            href="/my-tickets"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/60 text-slate-200 text-xs font-bold transition"
          >
            <span>💳</span>
            <span>Billetera</span>
          </Link>

          <Link
            href="/resale"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/60 text-slate-200 text-xs font-bold transition"
          >
            <span>🔄</span>
            <span>Reventa</span>
          </Link>

          <div className="border-t border-slate-800/80 my-1" />

          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-rose-950/30 text-rose-400 text-xs font-bold transition cursor-pointer"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}