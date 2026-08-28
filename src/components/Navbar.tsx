'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/core/supabase/client';

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-widest text-yellow-400">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
          OASIS.
        </Link>

        {/* Solapas de Navegación */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/resale"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              pathname?.startsWith('/resale')
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent'
            }`}
          >
            <span>🔄</span> Reventa Oficial
          </Link>

          <Link
            href="/my-tickets"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              pathname === '/my-tickets'
                ? 'bg-yellow-400 text-black font-bold shadow-md shadow-yellow-400/20'
                : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border border-yellow-400/30'
            }`}
          >
            <span>🎟</span> {user ? 'Mis Entradas' : 'Ingresar'}
          </Link>

          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-xl text-xs font-mono text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            Backstage
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;