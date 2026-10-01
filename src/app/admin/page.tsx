'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserMenu from '@/components/UserMenu';
import { useSession } from '@/core/auth/useSession';
import AuroraBackground from '@/components/fx/AuroraBackground';
// Las herramientas reales se muestran embebidas acá adentro (en vez de
// mandar a otra URL con <Link>) para que un click en el sidebar cambie de
// pantalla al instante, sin la navegación de página completa de Next. Son
// los mismos componentes que usan las rutas /admin/eventos, /admin/pedidos,
// etc. — esas rutas se mantienen intactas para accesos directos/bookmarks.
import ProducerEventsPage from './eventos/page';
import ProducerOrdersPage from './pedidos/page';
import TeamPage from './equipo/page';
import MercadoPagoConnectPage from './mercadopago/page';
import BuyTicketsPage from './comprar-tickets/page';
import ProducerCostsPage from './costos/page';
import ProducerAttendeesPage from './asistentes/page';
import ProducerCourtesyPage from './cortesias/page';
import ProducerMetricsPage from './metricas/page';
import ScannerPage from '../scanner/page';
import BroadcastPage from './broadcast/page';
import BarraPage from './barra/page';
import CuponesRrppPage from './cupones-rrpp/page';
import PasesPage from './pases/page';

type RealTab =
  | 'eventos'
  | 'pedidos'
  | 'equipo'
  | 'mercadopago'
  | 'comprar'
  | 'escanear'
  | 'asistentes'
  | 'cortesias'
  | 'costos'
  | 'metricas'
  | 'broadcast'
  | 'barra'
  | 'cupones'
  | 'pases';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  dni?: string;
  phone?: string;
  role: 'OWNER' | 'ADMIN' | 'DOOR' | 'BAR';
  producerName: string;
  producerType?: 'ENTERTAINMENT' | 'CORPORATE' | 'THEATRE' | 'CLUB';
}

// Función auxiliar declarada correctamente para evitar ReferenceError
const getProducersForEmail = (team: any[], targetEmail: string) => {
  if (!targetEmail) return [];
  return team
    .filter((m: any) => {
      const matchesEmail = (m.email || '').toLowerCase().trim() === targetEmail.toLowerCase().trim();
      const isEntertainment = m.producerType === 'ENTERTAINMENT' || !m.producerType || m.producerType === 'CORPORATE' || m.producerType === 'THEATRE';
      return matchesEmail && isEntertainment;
    })
    .map((m: any) => m.producerName);
};

export default function LiveExperienceAdmin() {
  const router = useRouter();
  // Identidad real (Supabase Auth) en vez de localStorage — antes esta
  // pantalla no reconocía ninguna sesión real, por más que existiera de
  // verdad una productora creada.
  const { user: sessionUser, isAuthenticated, loading: sessionLoading } = useSession();

  const [isMounted, setIsMounted] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [activeProducer, setActiveProducer] = useState<string>('');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeRealTab, setActiveRealTab] = useState<RealTab | null>('metricas');

  const [prepaidBalances, setPrepaidBalances] = useState<{ [producer: string]: number }>({});

  const [newProducerModal, setNewProducerModal] = useState(false);
  const [producerForm, setProducerForm] = useState({
    producerName: '',
    producerType: 'ENTERTAINMENT' as 'ENTERTAINMENT' | 'CORPORATE' | 'THEATRE' | 'CLUB',
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
  });

  // Identidad, equipo y saldo: antes se adivinaban de localStorage (por
  // eso una productora creada de verdad nunca aparecía acá). Ahora salen
  // de la sesión real de Supabase Auth y de las mismas rutas /api/producers
  // que ya usan /admin/eventos, /admin/equipo, etc.
  const loadRealIdentity = async () => {
    if (!sessionUser) {
      setCurrentUserEmail('');
      setActiveProducer('');
      return;
    }

    setCurrentUserEmail(sessionUser.email);
    setProducerForm((prev) => ({ ...prev, email: sessionUser.email }));

    try {
      // Antes esto era secuencial (team, y recién después me) — dos idas y
      // vueltas de red una atrás de la otra. Ninguna depende de la otra, así
      // que se piden juntas para no duplicar la espera.
      const [res, meRes] = await Promise.all([fetch('/api/producers/team'), fetch('/api/producers/me')]);

      if (!res.ok) {
        // No es staff de ninguna productora todavía
        setActiveProducer('');
        setTeamMembers([]);
        return;
      }
      const data = await res.json();
      const producerName = data.producerName || '';
      setActiveProducer(producerName);

      const mapped: TeamMember[] = (data.team || []).map((m: any) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        dni: m.dni || undefined,
        phone: m.phone || undefined,
        role: m.role,
        producerName,
      }));
      setTeamMembers(mapped);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.producer) {
          setPrepaidBalances((prev) => ({ ...prev, [meData.producer.name]: meData.producer.prepaid_balance }));
        }
      }
    } catch (e) {
      console.error('Error cargando la productora real:', e);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    loadRealIdentity();
  }, [sessionLoading, sessionUser]);

  // El saldo de "Disponibles" del header solo se pedía una vez al entrar a
  // /admin — si la productora vendía una entrada (o mandaba una cortesía)
  // desde alguna de las pestañas de acá adentro, el número quedaba viejo
  // hasta recargar la página entera. Ahora se vuelve a pedir cada vez que
  // se cambia de pestaña (después de confirmar una venta, por ejemplo) y
  // cada 20s mientras el panel sigue abierto, para que el descuento real
  // se refleje sin tener que recargar a mano.
  const refreshBalance = async () => {
    if (!activeProducer) return;
    try {
      const res = await fetch('/api/producers/me');
      if (res.ok) {
        const data = await res.json();
        if (data.producer) {
          setPrepaidBalances((prev) => ({ ...prev, [data.producer.name]: data.producer.prepaid_balance }));
        }
      }
    } catch (e) {
      console.error('Error actualizando el saldo:', e);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [activeRealTab, activeProducer]);

  useEffect(() => {
    if (!activeProducer) return;
    const interval = setInterval(refreshBalance, 20000);
    return () => clearInterval(interval);
  }, [activeProducer]);

  // Antes esto creaba la productora solo en localStorage (le_team_members),
  // sin que el servidor se enterara — cualquiera que la creara desde acá
  // (el botón "Crear Productora" de este mismo panel) terminaba con una
  // productora fantasma: se veía en la UI pero /api/producers/* la
  // rechazaba porque en Supabase no existía. Ahora pega contra el mismo
  // endpoint real que usa /auth.
  const [registeringProducer, setRegisteringProducer] = useState(false);
  const handleRegisterProducer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producerForm.producerName || !producerForm.firstName || !producerForm.lastName || !producerForm.dni || !producerForm.phone) {
      alert('Por favor completá todos los campos obligatorios.');
      return;
    }
    if (!currentUserEmail) {
      alert('No hay una sesión activa con correo electrónico.');
      return;
    }

    setRegisteringProducer(true);
    try {
      const res = await fetch('/api/auth/register-producer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producerName: producerForm.producerName,
          producerType: producerForm.producerType,
          dni: producerForm.dni.trim(),
          phone: producerForm.phone.trim(),
          fullName: `${producerForm.firstName} ${producerForm.lastName}`.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la productora');

      setNewProducerModal(false);
      await loadRealIdentity();

      if (producerForm.producerType === 'CLUB') {
        router.push('/admin/club');
      } else {
        alert(`¡Productora "${data.producerName}" creada con éxito para ${currentUserEmail}!`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRegisteringProducer(false);
    }
  };

  const uniqueProducers = isMounted ? Array.from(new Set(getProducersForEmail(teamMembers, currentUserEmail))) : [];
  const currentPrepaidCount = prepaidBalances[activeProducer] ?? 500;

  if (!isMounted) return null;

  // BLOQUEO ABSOLUTO SI NO HAY SESIÓN ACTIVA
  if (!currentUserEmail) {
    return (
      <div className="relative min-h-screen bg-[#05070d] text-slate-100 flex flex-col items-center justify-center p-6 font-mono selection:bg-blue-500 selection:text-white overflow-hidden">
        <AuroraBackground />
        <div className="glass glass-edge hud-corners relative z-10 max-w-md w-full rounded-3xl p-8 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black mx-auto">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="font-luxury text-xl font-black text-white uppercase">Iniciá Sesión</h1>
            <p className="text-xs text-slate-400">No hay ninguna cuenta logueada. Para administrar productoras debés iniciar sesión.</p>
          </div>
          <Link
            href="/"
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 block shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            Ir a la Cartelera / Iniciar Sesión 🔑
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white overflow-hidden">
      <AuroraBackground />

      {/* HEADER SUPERIOR */}
      <header className="glass relative px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 font-mono">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-400 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20">
            {activeProducer ? activeProducer.substring(0, 2).toUpperCase() : 'LE'}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="group relative flex items-center gap-1.5 rounded-lg -ml-2 pl-2 pr-1 py-0.5 hover:bg-white/5 transition min-w-0">
              <select
                value={activeProducer}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'NEW') {
                    setNewProducerModal(true);
                  } else {
                    setActiveProducer(val);
                  }
                }}
                className="bg-transparent text-white font-luxury text-sm font-black tracking-widest uppercase focus:outline-none cursor-pointer appearance-none pr-1 max-w-[40vw] sm:max-w-none truncate"
              >
                {uniqueProducers.length === 0 && (
                  <option value="" disabled className="bg-[#0b1120] text-slate-400">Sin productoras para este mail</option>
                )}
                {uniqueProducers.map((prod) => (
                  <option key={prod} value={prod} className="bg-[#0b1120] text-white">🏢 {prod}</option>
                ))}
                <option disabled value="" className="bg-[#0b1120] text-slate-600">────────────────────</option>
                <option value="NEW" className="bg-[#0b1120] text-blue-400 font-bold">+ Crear productora para {currentUserEmail}</option>
              </select>
              <span className="shrink-0 text-slate-500 group-hover:text-blue-400 transition text-[10px] pointer-events-none">▾</span>
            </div>
            <span className="hidden sm:block text-[10px] text-blue-400/80 uppercase tracking-wider truncate">{currentUserEmail}</span>
          </div>

          {activeProducer && (
            <div className="shrink-0 ml-1 sm:ml-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-2 shadow-inner">
              <span className="hidden sm:inline">🎟️ Disponibles:</span>
              <span className="sm:hidden">🎟️</span>
              <span className="text-white font-black text-sm">{currentPrepaidCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold font-mono">
          <Link href="/admin/club" className="px-3 sm:px-4 py-2 rounded-2xl bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition flex items-center gap-2 shadow-md">
            <span>⚽</span>
            <span className="hidden lg:inline">Ir a Módulo Clubes / Deportes</span>
            <span className="hidden sm:inline lg:hidden">Deportes</span>
          </Link>
          <Link href="/" className="hidden sm:inline text-slate-400 hover:text-white transition">Ver Cartelera</Link>
          <UserMenu />
        </div>
      </header>

      {/* CUERPO PRINCIPAL CON SIDEBAR */}
      <div className="relative z-10 flex flex-1 overflow-hidden font-mono">

        <aside className="glass-light w-64 border-r border-white/5 flex flex-col justify-between p-4 shrink-0 select-none overflow-y-auto">
          <nav className="space-y-1 text-xs font-medium">

            {/* Todo lo que se gestiona desde acá ya vive en Supabase, no en
                localStorage — no hay más sección "local/demo". Agrupado por
                tema para que sea más fácil de escanear de un vistazo. */}
            <div className="mb-2 px-3">
              <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Conectado a tu cuenta real
              </span>
            </div>

            {(
              [
                {
                  label: 'Ventas',
                  items: [
                    { id: 'eventos', icon: '🎫', label: 'Eventos' },
                    { id: 'pedidos', icon: '💳', label: 'Confirmar Ventas' },
                    { id: 'comprar', icon: '🎟️', label: 'Comprar Tickets' },
                    { id: 'mercadopago', icon: '💙', label: 'Mercado Pago' },
                  ],
                },
                {
                  label: 'En el evento',
                  items: [
                    { id: 'escanear', icon: '📷', label: 'Escanear QR (Puerta)' },
                    { id: 'barra', icon: '🍸', label: 'Escáner de Barra' },
                  ],
                },
                {
                  label: 'Público',
                  items: [
                    { id: 'asistentes', icon: '👤', label: 'CRM de Asistentes' },
                    { id: 'cortesias', icon: '🎁', label: 'Guestlist & Cortesías' },
                    { id: 'broadcast', icon: '📢', label: 'Broadcast & Alertas' },
                    { id: 'pases', icon: '📨', label: 'Pases PDF & App' },
                    { id: 'cupones', icon: '🏷️', label: 'Cupones & RRPP' },
                  ],
                },
                {
                  label: 'Gestión',
                  items: [
                    { id: 'costos', icon: '🧾', label: 'Cobros & Gastos' },
                    { id: 'metricas', icon: '📊', label: 'Dashboard & Métricas' },
                    { id: 'equipo', icon: '👥', label: 'Equipo' },
                  ],
                },
              ] as { label: string; items: { id: RealTab; icon: string; label: string }[] }[]
            ).map((group) => (
              <div key={group.label} className="mb-3.5">
                <span className="px-3 text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1">
                  {group.label}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveRealTab(t.id)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors duration-150 ease-out-strong active:scale-[0.98] cursor-pointer text-left ${
                        activeRealTab === t.id
                          ? 'text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-emerald-300'
                      }`}
                    >
                      <span>{t.icon}</span><span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">

          {!activeProducer ? (
            <div className="glass glass-edge p-16 text-center rounded-3xl space-y-4 max-w-lg mx-auto my-12">
              <span className="text-4xl">🏢</span>
              <h2 className="font-luxury text-xl font-bold text-white uppercase">No tenés ninguna productora para este correo</h2>
              <p className="text-xs text-slate-400">Estás conectado con <strong className="text-blue-400">{currentUserEmail}</strong>. Registrá tu productora exclusiva para este mail.</p>
              <button
                onClick={() => setNewProducerModal(true)}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                + Crear Productora para este Mail 🚀
              </button>
            </div>
          ) : activeRealTab ? (
            <div key={activeRealTab} className="-m-8">
              {activeRealTab === 'eventos' && <ProducerEventsPage />}
              {activeRealTab === 'pedidos' && <ProducerOrdersPage />}
              {activeRealTab === 'equipo' && <TeamPage />}
              {activeRealTab === 'mercadopago' && <MercadoPagoConnectPage />}
              {activeRealTab === 'comprar' && <BuyTicketsPage />}
              {activeRealTab === 'escanear' && <ScannerPage />}
              {activeRealTab === 'asistentes' && <ProducerAttendeesPage />}
              {activeRealTab === 'cortesias' && <ProducerCourtesyPage />}
              {activeRealTab === 'costos' && <ProducerCostsPage />}
              {activeRealTab === 'metricas' && <ProducerMetricsPage />}
              {activeRealTab === 'broadcast' && <BroadcastPage />}
              {activeRealTab === 'barra' && <BarraPage />}
              {activeRealTab === 'cupones' && <CuponesRrppPage />}
              {activeRealTab === 'pases' && <PasesPage />}
            </div>
          ) : null}

        </main>
      </div>

      {/* MODAL CREAR NUEVA PRODUCTORA */}
      {newProducerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs">
          <div className="glass glass-edge hud-corners max-w-md w-full rounded-3xl p-6 space-y-4">
            <h3 className="font-luxury text-base font-black text-white uppercase">✨ Registrar Nueva Productora / Entidad</h3>
            <form onSubmit={handleRegisterProducer} className="space-y-3">
              <input type="text" required placeholder="Nombre Comercial" value={producerForm.producerName} onChange={e => setProducerForm({...producerForm, producerName: e.target.value})} className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white font-bold" />
              
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-bold text-[10px]">Tipo de Entidad / Rubro</label>
                <select value={producerForm.producerType} onChange={e => setProducerForm({...producerForm, producerType: e.target.value as any})} className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-blue-400 font-bold">
                  <option value="ENTERTAINMENT">🎉 Entretenimiento / Fiestas / Festivales</option>
                  <option value="CLUB">⚽ Club / Institución / Deportes</option>
                  <option value="CORPORATE">💼 Corporativo / Congresos</option>
                  <option value="THEATRE">🎭 Teatro / Cultura</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="Nombre" value={producerForm.firstName} onChange={e => setProducerForm({...producerForm, firstName: e.target.value})} className="px-3.5 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white" />
                <input type="text" required placeholder="Apellido" value={producerForm.lastName} onChange={e => setProducerForm({...producerForm, lastName: e.target.value})} className="px-3.5 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white" />
              </div>
              <input type="text" required placeholder="DNI" value={producerForm.dni} onChange={e => setProducerForm({...producerForm, dni: e.target.value})} className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white" />
              <input type="email" required disabled value={currentUserEmail} className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-emerald-400 font-bold opacity-80" />
              <input type="text" required placeholder="Teléfono" value={producerForm.phone} onChange={e => setProducerForm({...producerForm, phone: e.target.value})} className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white" />
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setNewProducerModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl border border-white/10">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}