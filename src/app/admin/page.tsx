'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import { useSession } from '@/core/auth/useSession';

// Antes esta página era un dashboard de 2000 líneas que corría 100% sobre
// localStorage (le_current_session, le_team_members, etc.) — desconectado
// de la cuenta real, la productora real y el equipo real. Alguien podía
// crear una productora de verdad (Supabase) y este panel jamás se
// enteraba, porque ni siquiera reconocía que había una sesión iniciada.
// Se reemplaza por un panel real: enlaza a las páginas que sí están
// conectadas a la base (eventos, ventas, equipo, Mercado Pago, saldo).

interface AdminSessionCtx {
  authenticated: boolean;
  role: string | null;
  email: string | null;
}

interface ProducerInfo {
  name: string;
  type: string;
  prepaid_balance: number;
}

export default function AdminHomePage() {
  const { isAuthenticated, loading: sessionLoading } = useSession();

  const [ctx, setCtx] = useState<AdminSessionCtx | null>(null);
  const [producer, setProducer] = useState<ProducerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch('/api/admin/session').then((r) => r.json()),
      fetch('/api/producers/me').then((r) => (r.ok ? r.json() : { producer: null })),
    ])
      .then(([sessionData, producerData]) => {
        setCtx(sessionData);
        setProducer(producerData.producer || null);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, sessionLoading]);

  if (sessionLoading || loading) {
    return <div className="min-h-screen bg-[#05070d] flex items-center justify-center text-xs text-neutral-500 font-mono">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col items-center justify-center gap-4 font-mono text-xs p-6 text-center">
        <span className="text-3xl">🔒</span>
        <p>Iniciá sesión para acceder al panel.</p>
        <Link href="/auth?redirect=/admin" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold uppercase">
          Iniciar Sesión →
        </Link>
      </div>
    );
  }

  const isPlatformAdmin = ctx?.role === 'SUPERADMIN' || ctx?.role === 'ADMIN' || ctx?.role === 'PASSWORD';
  const producerCards = [
    { href: '/admin/eventos', icon: '🎫', title: 'Mis Eventos', desc: 'Crear y publicar eventos con sus tandas' },
    { href: '/admin/pedidos', icon: '💳', title: 'Confirmar Ventas', desc: 'Aprobar transferencias pendientes' },
    { href: '/admin/equipo', icon: '👥', title: 'Equipo', desc: 'Sumar staff (DOOR/BAR/ADMIN)' },
    { href: '/admin/mercadopago', icon: '💙', title: 'Mercado Pago', desc: 'Conectar tu cuenta para cobrar' },
    { href: '/admin/comprar-tickets', icon: '🎟️', title: 'Comprar Tickets', desc: 'Recargar tu saldo prepago' },
  ];
  const platformCards = [
    { href: '/admin/admins', icon: '🛡️', title: 'Administradores', desc: 'Gestionar quién entra como staff de Live Experience' },
    { href: '/admin/compras-productoras', icon: '📦', title: 'Compras de Productoras', desc: 'Confirmar recargas de saldo' },
  ];

  return (
    <div className="min-h-screen bg-[#05070d] text-white font-mono">
      <header className="border-b border-white/10 bg-[#090d16] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              {producer?.name || (isPlatformAdmin ? 'Live Experience' : 'Panel')}
            </span>
            <h1 className="text-lg font-black uppercase text-white">Panel</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {producer && (
          <div className="flex items-center justify-between bg-[#0c0f16] border border-white/10 rounded-2xl p-4">
            <span className="text-xs text-neutral-400">
              Saldo de tickets: <strong className={producer.prepaid_balance > 0 ? 'text-emerald-400' : 'text-rose-400'}>{producer.prepaid_balance}</strong>
            </span>
            <Link href="/admin/comprar-tickets" className="text-xs text-amber-400 underline">Comprar más →</Link>
          </div>
        )}

        {!producer && !isPlatformAdmin && (
          <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs space-y-3">
            <p>Todavía no sos staff de ninguna productora.</p>
            <Link href="/auth" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl transition">
              Registrar Productora →
            </Link>
          </div>
        )}

        {producer && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase text-neutral-400">Tu Productora</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {producerCards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 hover:border-amber-500/50 transition flex items-start gap-3"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <span className="text-sm font-bold text-white block">{c.title}</span>
                    <span className="text-[11px] text-neutral-400">{c.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {isPlatformAdmin && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase text-neutral-400">Live Experience</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platformCards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 hover:border-blue-500/50 transition flex items-start gap-3"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <span className="text-sm font-bold text-white block">{c.title}</span>
                    <span className="text-[11px] text-neutral-400">{c.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
