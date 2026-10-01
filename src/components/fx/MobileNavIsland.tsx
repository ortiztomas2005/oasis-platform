'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/core/auth/useSession';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const BASE_ITEMS: NavItem[] = [
  { href: '/', icon: '🏠', label: 'Inicio' },
  { href: '/club/partidos', icon: '⚽', label: 'Deportes' },
  { href: '/resale', icon: '🔄', label: 'Reventa' },
  { href: '/bar', icon: '🍸', label: 'Barra' },
  { href: '/my-tickets', icon: '💳', label: 'Billetera' },
];

// Las mismas funciones que ya viven en el header de escritorio (ese
// `hidden sm:flex` que hoy desaparece entero en mobile sin dejar ningún
// reemplazo) ahora quedan accesibles siempre, en una isla flotante fija
// abajo — el patrón de navegación mobile más usado en apps nativas.
// Se monta una sola vez en el layout raíz, así que cubre todo el sitio
// sin tener que tocar cada página.
export default function MobileNavIsland() {
  const pathname = usePathname();
  const { isAuthenticated } = useSession();
  const [producerName, setProducerName] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setProducerName(null);
      return;
    }
    fetch('/api/producers/me')
      .then((res) => (res.ok ? res.json() : { producer: null }))
      .then((data) => setProducerName(data.producer?.name || null))
      .catch(() => setProducerName(null));
  }, [isAuthenticated]);

  // El panel de admin, el escáner de puerta y el de barra ya tienen su
  // propia navegación de pantalla completa (sidebar / cámara) — la isla
  // ahí taparía controles en vez de ayudar, así que no se monta.
  const hideOn = ['/admin', '/scanner', '/bar/counter'];
  if (hideOn.some((p) => pathname === p || pathname?.startsWith(p + '/'))) return null;

  const lastItem: NavItem = producerName
    ? { href: '/admin', icon: '📊', label: 'Panel' }
    : isAuthenticated
    ? { href: '/auth', icon: '🏢', label: 'Productora' }
    : { href: '/auth', icon: '🔑', label: 'Ingresar' };

  const items = [...BASE_ITEMS, lastItem];

  return (
    <nav
      aria-label="Navegación principal"
      className="glass glass-edge md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full px-1.5 py-1.5 flex items-center gap-1 shadow-2xl pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
    >
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-lg transition-[background-color,transform] duration-150 ease-out-strong active:scale-90 ${
              active ? 'bg-blue-600 shadow-lg shadow-blue-600/40' : 'hover:bg-white/10'
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}
