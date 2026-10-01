'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserMenu from '@/components/UserMenu';
import { useSession } from '@/core/auth/useSession';
import { gsap, useGSAP, ScrollTrigger } from '@/core/gsap';
import RevealText from '@/components/fx/RevealText';
import Magnetic from '@/components/fx/Magnetic';
import Marquee from '@/components/fx/Marquee';
import CountUp from '@/components/fx/CountUp';
import AuroraBackground from '@/components/fx/AuroraBackground';
import GlitchHeading from '@/components/fx/GlitchHeading';

export interface Tier {
  name: string;
  price: number;
  capacity: number;
  soldCount?: number;
  entryCutoffTime?: string;
  showStockToClients?: boolean;
  scarcityThreshold?: number;
  status?: 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN';
  description?: string;
}

export interface EventItem {
  id: string;
  producerName: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  city: string;
  imageUrl: string;
  genre: string;
  description: string;
  tiers: Tier[];
  status: 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}

export default function CatalogPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);

  const [viewMode, setViewMode] = useState<'catalog' | 'details' | 'checkout'>('catalog');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(3);
  const [cart, setCart] = useState<{ [tierName: string]: number }>({});

  const { user: sessionUser, isAuthenticated: isLoggedIn } = useSession();
  const [holderName, setHolderName] = useState<string>('');
  const [holderDni, setHolderDni] = useState<string>('');
  const [holderEmail, setHolderEmail] = useState<string>('');
  const [userProducerName, setUserProducerName] = useState<string | null>(null);

  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [appliedPromoName, setAppliedPromoName] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<'mercado_pago' | 'transfer'>('mercado_pago');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{ type: 'success' | 'error'; message: string; references?: string[] } | null>(null);

  const heroSectionRef = useRef<HTMLElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const feedbackModalRef = useRef<HTMLDivElement>(null);

  // Prellenar los datos del comprador con la sesión real de Supabase Auth y
  // resolver si ya es dueño de una productora (antes esto se leía de un
  // localStorage que cualquiera podía editar a mano desde la consola).
  useEffect(() => {
    if (!sessionUser) {
      setHolderName('');
      setHolderDni('');
      setHolderEmail('');
      setUserProducerName(null);
      return;
    }

    setHolderName(sessionUser.name);
    setHolderEmail(sessionUser.email);
    setHolderDni(sessionUser.dni);

    // Se resuelve server-side (service role) en vez de con el cliente
    // anon-key: una consulta directa a team_members desde el navegador
    // depende de que haya políticas RLS de lectura, y si no las hay
    // simplemente no devuelve nada sin avisar del error.
    fetch('/api/producers/me')
      .then((res) => (res.ok ? res.json() : { producer: null }))
      .then((data) => setUserProducerName(data.producer?.name || null))
      .catch(() => setUserProducerName(null));
  }, [sessionUser]);

  useEffect(() => {
    const loadEventsFromSupabase = async () => {
      try {
        // Antes esto consultaba Supabase directo desde el navegador con la
        // clave anon, lo que exigía dejar 'events'/'ticket_tiers' con RLS
        // abierto (o sin políticas) para que cualquiera pudiera leerlos —
        // y de paso exponía la tabla 'tickets' completa (nombres, DNI, QR
        // reales) a quien consultara la API pública de Supabase a mano.
        // Ahora se pide por un endpoint propio, ya filtrado a eventos
        // públicos y resuelto con la service role del lado del servidor.
        const res = await fetch('/api/admin/events-data');
        if (!res.ok) {
          console.error('❌ Error cargando eventos:', res.status);
          setEvents([]);
          return;
        }

        const { events: dbEvents, tiers: dbTiers } = await res.json();

        if (dbEvents && dbEvents.length > 0) {
          // La tabla real solo tiene un timestamp único 'date' (no
          // start_time/end_time separados como esperaba este mapeo viejo),
          // así que la fecha y la hora para mostrar se derivan de ahí.
          const formattedEvents: EventItem[] = dbEvents.map((ev: any) => {
            const eventDate = ev.date ? new Date(ev.date) : null;
            const eventTiers = (dbTiers || []).filter((t: any) => t.event_id === ev.id);
            return {
              id: ev.id,
              producerName: ev.producer_name,
              name: ev.name,
              date: eventDate ? eventDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '',
              startTime: eventDate ? eventDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '',
              endTime: ev.door_time || '',
              venue: ev.venue,
              city: ev.city,
              imageUrl: ev.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
              genre: ev.genre || 'Melodic Techno',
              description: ev.description || '',
              status: ev.status,
              tiers: eventTiers.map((t: any) => ({
                name: t.name,
                price: t.price,
                capacity: t.available_capacity ?? t.total_capacity ?? t.capacity ?? 0,
                showStockToClients: t.show_stock_to_clients ?? true,
                scarcityThreshold: t.low_stock_threshold ?? 10,
                status: t.status,
                description: t.description || '',
                entryCutoffTime: t.entry_cutoff_time || '',
              })),
            };
          });

          setEvents(formattedEvents);
        } else {
          console.log('ℹ️ La tabla de eventos en Supabase está vacía actualmente.');
          setEvents([]);
        }
      } catch (e) {
        console.error('❌ Excepción general cargando eventos:', e);
        setEvents([]);
      }
    };

    loadEventsFromSupabase();
  }, []);

  // Parallax sutil en la imagen del evento destacado: se mueve más lento
  // que el scroll (la imagen ya está agrandada con scale-110 por CSS y el
  // contenedor recorta con overflow-hidden, así que nunca deja ver bordes
  // vacíos). Solo corre si hay evento destacado y con reduced-motion
  // desactivado.
  useGSAP(
    () => {
      if (!heroSectionRef.current || !heroImgRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tween = gsap.to(heroImgRef.current, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: heroSectionRef.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        return () => tween.scrollTrigger?.kill();
      });
      return () => mm.revert();
    },
    { scope: heroSectionRef, dependencies: [viewMode === 'catalog' && events[0]?.id] }
  );

  // Las tarjetas de evento entran con fade + slide al aparecer en
  // viewport (no solo al montar) — importante para una cartelera larga
  // donde la mayoría de las tarjetas arrancan debajo del pliegue.
  useGSAP(
    () => {
      if (!gridRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gridRef.current!.querySelectorAll('.event-card');
        if (cards.length === 0) return;
        gsap.set(cards, { opacity: 0, y: 48, scale: 0.96 });
        const triggers = ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true }),
        });
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: gridRef, dependencies: [events.length] }
  );

  // Pop de entrada para el modal de feedback de compra (reemplaza el
  // alert() nativo del navegador por algo acorde a la estética del sitio).
  useGSAP(
    () => {
      if (!feedbackModalRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(feedbackModalRef.current, { opacity: 0, scale: 0.92, y: 16, duration: 0.35, ease: 'power3.out' });
      });
      return () => mm.revert();
    },
    { scope: feedbackModalRef, dependencies: [!!purchaseFeedback] }
  );

  const goToDetails = (event: EventItem) => {
    setSelectedEvent(event);
    setCart({});
    setViewMode('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateCart = (tierName: string, delta: number) => {
    setCart((prev) => {
      const current = prev[tierName] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [tierName]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [tierName]: next };
    });
  };

  const totalTickets = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = selectedEvent 
    ? selectedEvent.tiers.reduce((acc, tier) => acc + (tier.price * (cart[tier.name] || 0)), 0)
    : 0;
  const discountAmount = Math.round((subtotal * discountPct) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    try {
      const coupons = JSON.parse(localStorage.getItem('le_coupons') || '[]');
      const found = coupons.find((c: any) => c.code.toUpperCase() === promoCode.trim().toUpperCase() && c.active);
      if (found) {
        setDiscountPct(found.discountPct);
        setAppliedPromoName(found.code);
        alert(`¡Cupón "${found.code}" aplicado con éxito! (${found.discountPct}% OFF)`);
      } else {
        alert('Cupón inválido o expirado.');
      }
    } catch {
      alert('Error al validar el cupón.');
    }
  };

  const handleProceedFromTickets = () => {
    if (totalTickets === 0) return alert('Debes seleccionar al menos un ticket.');
    
    if (isLoggedIn) {
      setCheckoutStep(3);
    } else {
      setCheckoutStep(2);
    }
    setViewMode('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmPurchase = async () => {
    if (!holderName || !holderDni || !holderEmail) return setPurchaseFeedback({ type: 'error', message: 'Por favor completá tus datos.' });
    if (!acceptedTerms) return setPurchaseFeedback({ type: 'error', message: 'Debes aceptar las condiciones generales de compra.' });
    if (!selectedEvent || totalTickets === 0) return setPurchaseFeedback({ type: 'error', message: 'Tu carrito está vacío.' });

    setIsProcessing(true);

    // Antes esta función insertaba tickets con status "VALID" directo a
    // Supabase desde el navegador, sin pasar por ningún cobro: cualquiera
    // podía "comprar" gratis con solo llenar el formulario. Ahora, igual que
    // en /events/[slug], cada entrada del carrito se manda como una orden
    // PENDING al backend. El ticket recién se emite cuando un admin aprueba
    // la orden desde /admin (o, para MercadoPago, cuando se confirme el
    // pago) — nunca directo desde el cliente.
    try {
      const endpoint = paymentMethod === 'mercado_pago' ? '/api/checkout/mercadopago' : '/api/checkout/transfer';
      const orderReferences: string[] = [];
      let redirectUrl: string | null = null;

      for (const [tierName, qty] of Object.entries(cart)) {
        const tierInfo = selectedEvent.tiers.find((t) => t.name === tierName);
        const unitPrice = tierInfo ? tierInfo.price - (tierInfo.price * discountPct) / 100 : 0;

        for (let i = 0; i < qty; i++) {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: selectedEvent.id,
              ticketTier: tierName,
              amount: unitPrice,
              customerName: holderName.trim(),
              customerEmail: holderEmail.toLowerCase().trim(),
              customerDni: holderDni.trim(),
              userId: null,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al registrar la orden');

          orderReferences.push(data.referenceCode);
          if (data.redirectUrl && !redirectUrl) redirectUrl = data.redirectUrl;
        }
      }

      setIsProcessing(false);
      setCart({});

      // Si MercadoPago devolvió un link de pago real, mandamos ahí directo
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setViewMode('catalog');
      setPurchaseFeedback({
        type: 'success',
        references: orderReferences,
        message: 'Tu compra quedó en revisión — vas a ver tus pases en "Mis Entradas" apenas se confirme el pago.',
      });
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setPurchaseFeedback({ type: 'error', message: err.message || 'Error al procesar la compra.' });
    }
  };

  const featuredEvent = events[featuredIndex] || events[0];

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white overflow-x-hidden">

      {/* FONDO AURORA — reemplaza los tres halos estáticos de antes por
          blobs que derivan orgánicamente (ver AuroraBackground). */}
      <AuroraBackground />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] bg-[size:28px_28px]" />

      {/* NAVBAR */}
      <header className="glass relative z-40 sticky top-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" onClick={() => setViewMode('catalog')} className="flex items-center gap-3.5 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-400 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/30 ring-1 ring-white/10 group-hover:shadow-blue-500/50 transition-shadow duration-300 ease-out-strong">
              LE
            </div>
            <div className="flex flex-col">
              <GlitchHeading className="neon-text font-luxury text-lg font-black tracking-[0.1em] uppercase text-white leading-none group-hover:text-blue-400 transition select-none">
                LIVE EXPERIENCE
              </GlitchHeading>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-4 font-mono text-xs">
            <button
              onClick={() => { window.location.href = '/club/partidos'; }}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-150 ease-out-strong active:scale-95 font-bold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 cursor-pointer"
            >
              <span>⚽</span> Deporte
            </button>

            <Link href="/resale" className="text-slate-300 hover:text-blue-400 font-bold transition-colors duration-150 ease-out-strong active:scale-95">Resale</Link>
            <Link href="/bar" className="text-slate-300 hover:text-blue-400 font-bold transition-colors duration-150 ease-out-strong active:scale-95">Barra</Link>
            <Link href="/my-tickets" className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold transition-colors duration-150 ease-out-strong hover:bg-blue-500/20 active:scale-95">
              💳 Billetera
            </Link>

            {userProducerName ? (
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] duration-200 ease-out-strong text-white font-black transition-[transform,background-color,box-shadow] cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                <span>📊</span> Ir a Panel ({userProducerName})
              </button>
            ) : (
              <Link
                href="/auth?redirect=/"
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] duration-200 ease-out-strong text-white font-bold transition-[transform,background-color] cursor-pointer"
              >
                🏢 Crear / Iniciar Productora
              </Link>
            )}

            <div className="pl-2 border-l border-white/10"><UserMenu /></div>
          </div>
        </div>
      </header>

      {/* CINTA EN MOVIMIENTO — recurso maximalista: una franja angosta con
          loop infinito que nunca para, debajo del navbar en todas las
          vistas. Puramente decorativa (aria-hidden adentro del propio
          componente), nunca bloquea nada porque no tiene pointer-events. */}
      <div className="glass-light relative z-10 border-b border-white/5 py-2 text-[11px] font-mono font-bold uppercase tracking-widest text-blue-300">
        <Marquee
          items={
            events.length > 0
              ? events.map((ev) => `${ev.name} — ${ev.city}`)
              : ['Live Experience', 'Entradas 100% verificadas', 'Reventa segura', 'Pago con MercadoPago o transferencia']
          }
          speed={events.length > 0 ? Math.max(22, events.length * 6) : 28}
        />
      </div>

      {/* VISTA CARTELERA */}
      {viewMode === 'catalog' && (
        <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-10 space-y-12 flex-1">
          {events.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-[#0b1120] border border-white/5 space-y-3 my-auto animate-fade-in">
              <span className="text-3xl">🗓️</span>
              <h3 className="font-luxury text-lg font-bold text-white uppercase">No hay eventos activos en la cartelera</h3>
              <p className="text-xs text-slate-400">Creá una productora y publicá tu primer evento para verlo reflejado aquí.</p>
              
              {userProducerName ? (
                <button 
                  onClick={() => router.push('/admin')}
                  className="mt-2 px-6 py-3 bg-blue-500 text-white font-black text-xs uppercase rounded-xl cursor-pointer shadow-lg"
                >
                  Ir al Panel de {userProducerName} 📊
                </button>
              ) : (
                <Link
                  href="/auth?redirect=/"
                  className="mt-2 inline-block px-6 py-3 bg-blue-500 text-white font-black text-xs uppercase rounded-xl cursor-pointer shadow-lg"
                >
                  Registrar Productora
                </Link>
              )}
            </div>
          ) : (
            <>
              {featuredEvent && (
                <section
                  ref={heroSectionRef}
                  onClick={() => goToDetails(featuredEvent)}
                  className="glass hud-corners relative rounded-[2rem] overflow-hidden group cursor-pointer active:scale-[0.995] transition-transform duration-150 ease-out-strong animate-hero-in before:absolute before:inset-0 before:z-20 before:rounded-[2rem] before:pointer-events-none before:ring-1 before:ring-inset before:ring-white/10 before:transition-all before:duration-300 before:ease-out-strong hover:before:ring-blue-400/40"
                >
                  {/* Glow de borde: un halo azul detrás de la tarjeta, apenas visible, que se intensifica al pasar el mouse — le da presencia de "producto premium" en vez de un panel plano. */}
                  <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-blue-500/40 via-transparent to-indigo-500/30 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 ease-out-strong pointer-events-none" />

                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      ref={heroImgRef}
                      src={featuredEvent.imageUrl}
                      alt={featuredEvent.name}
                      className="w-full h-full scale-110 object-cover opacity-40 group-hover:scale-125 transition-transform duration-1000 ease-out-strong"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/70 to-[#05070d]/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#05070d]/60 via-transparent to-transparent" />
                  </div>

                  <div className="relative z-10 p-8 sm:p-14 flex flex-col justify-end min-h-[420px] space-y-5 max-w-2xl">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white border border-blue-400/40 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/30">
                        ★ Destacado
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">{featuredEvent.venue} · {featuredEvent.city}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest block">
                        {featuredEvent.date} — {featuredEvent.startTime} HS
                      </span>
                      <RevealText
                        as="h1"
                        type="words"
                        className="font-luxury text-4xl sm:text-5xl font-black uppercase tracking-wide bg-gradient-to-br from-white via-white to-blue-200 bg-clip-text text-transparent drop-shadow-sm block"
                      >
                        {featuredEvent.name}
                      </RevealText>
                    </div>

                    <div className="pt-2 flex items-center gap-4 font-mono">
                      <Magnetic strength={0.3}>
                        <span className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black uppercase text-xs rounded-xl transition-[box-shadow,background-color] duration-200 ease-out-strong shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 active:scale-[0.97] tracking-wider inline-block">
                          Ver Evento y Tickets →
                        </span>
                      </Magnetic>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <div className="flex items-end justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-1 h-8 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500 shadow-lg shadow-blue-500/30" />
                    <div>
                      <span className="text-[10px] text-blue-400 font-mono uppercase font-bold tracking-widest block">● Próximas Fechas</span>
                      <RevealText as="h2" type="chars" scrollTrigger className="font-luxury text-2xl font-bold uppercase text-white tracking-wider block">
                        Cartelera General
                      </RevealText>
                    </div>
                  </div>
                  <span className="hidden sm:block text-[10px] font-mono text-slate-500 uppercase tracking-widest">{events.length} evento{events.length !== 1 ? 's' : ''}</span>
                </div>

                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((ev) => {
                    const fromPrice = ev.tiers.length > 0 ? Math.min(...ev.tiers.map((t) => t.price)) : null;
                    return (
                    <div
                      key={ev.id}
                      className="event-card relative rounded-2xl bg-[#0b1120] border border-white/5 hover:border-blue-500/40 transition-[transform,box-shadow,border-color] duration-300 ease-out-strong hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col overflow-hidden shadow-xl group cursor-pointer"
                      onClick={() => goToDetails(ev)}
                    >
                      <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out-strong z-10" />

                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={ev.imageUrl}
                          alt={ev.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out-strong opacity-85"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent" />
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 text-blue-300 border border-blue-500/30 text-[9px] font-mono font-bold uppercase backdrop-blur-md">
                          📍 {ev.city}
                        </span>
                        {fromPrice !== null && (
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-blue-500/90 text-white border border-blue-300/40 text-[10px] font-mono font-black uppercase shadow-lg shadow-blue-500/40 backdrop-blur-md">
                            Desde <CountUp value={fromPrice} prefix="$" />
                          </span>
                        )}
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider block">
                            {ev.date}
                          </span>
                          <h3 className="font-luxury text-base font-bold text-white leading-snug group-hover:text-blue-300 transition-colors duration-200 ease-out-strong">
                            {ev.name}
                          </h3>
                        </div>

                        <div className="w-full py-2.5 bg-white/5 group-hover:bg-blue-500 border border-white/10 group-hover:border-blue-500 text-slate-300 group-hover:text-white font-black text-[11px] uppercase rounded-xl transition-colors duration-200 ease-out-strong font-mono tracking-wider text-center">
                          Ver Información & Tickets →
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </main>
      )}

      {/* VISTA DETALLES */}
      {viewMode === 'details' && selectedEvent && (
        <main className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 flex-1 animate-fade-in font-mono">
          <button 
            onClick={() => setViewMode('catalog')} 
            className="text-xs text-slate-400 hover:text-blue-400 transition mb-6 block cursor-pointer font-bold"
          >
            ← Volver a la Cartelera
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img src={selectedEvent.imageUrl} alt={selectedEvent.name} className="w-full h-auto object-cover" />
              </div>
              <div className="p-6 rounded-3xl bg-[#0b1120] border border-white/5 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Horario</span>
                  <p className="text-white font-bold">{selectedEvent.date} · Desde {selectedEvent.startTime} HS</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Ubicación</span>
                  <p className="text-white font-bold">{selectedEvent.venue}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3 border-b border-white/10 pb-6">
                <h1 className="font-luxury text-3xl sm:text-4xl font-black text-white uppercase tracking-wide">
                  {selectedEvent.name}
                </h1>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="space-y-4">
                <span className="text-xs uppercase font-bold text-blue-400 block tracking-widest">Seleccioná tus Tickets</span>
                
                <div className="space-y-3">
                  {selectedEvent.tiers.map((tier, idx) => {
                    const qty = cart[tier.name] || 0;
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row bg-[#0c0f16] border border-white/5 rounded-2xl overflow-hidden shadow-lg p-5 justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="text-white font-bold text-sm">
                            {tier.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-sans">{tier.description || 'Acceso general.'}</p>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:pl-4 sm:border-l border-white/10">
                          <span className="text-xl font-black text-white">${tier.price.toLocaleString('es-AR')}</span>
                          
                          <div className="flex items-center gap-3 bg-[#05070d] border border-white/10 rounded-full px-2 py-1">
                            <button onClick={() => updateCart(tier.name, -1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 text-white font-black transition duration-[120ms] ease-out-strong cursor-pointer">
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-white">{qty}</span>
                            <button onClick={() => updateCart(tier.name, 1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 text-white font-black transition duration-[120ms] ease-out-strong cursor-pointer">
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalTickets > 0 && (
                  <div className="pt-6 flex justify-end">
                    <button
                      onClick={() => handleProceedFromTickets()}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] duration-200 ease-out-strong text-white font-black uppercase text-xs rounded-xl transition-[transform,background-color,box-shadow] shadow-xl shadow-blue-500/20 cursor-pointer tracking-wider"
                    >
                      Continuar al Pago ({totalTickets} tickets) →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VISTA CHECKOUT */}
      {viewMode === 'checkout' && selectedEvent && (
        <main className="relative z-10 max-w-6xl mx-auto w-full px-6 py-10 flex-1 animate-fade-in font-mono space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px]">✓</span>
              <span>TICKETS</span>
            </div>
            <div className="flex-1 h-[1px] mx-4 bg-slate-800" />
            <div className={`flex items-center gap-2 text-xs font-bold ${isLoggedIn ? 'text-emerald-400' : 'text-blue-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isLoggedIn ? 'bg-emerald-500/25 border border-emerald-500' : 'bg-blue-500/25 border border-blue-500'}`}>
                {isLoggedIn ? '✓' : '●'}
              </span>
              <span>TUS DATOS {isLoggedIn ? '(REGISTRADO)' : ''}</span>
            </div>
            <div className="flex-1 h-[1px] mx-4 bg-slate-800" />
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-blue-500/25 border border-blue-500 flex items-center justify-center text-[10px]">03</span>
              <span>PAGO</span>
            </div>
          </div>

          {checkoutStep === 2 && !isLoggedIn && (
            <div className="max-w-xl mx-auto space-y-6 bg-[#0c0f16] border border-white/10 p-8 rounded-3xl">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white">Tus Datos</h2>
                <p className="text-xs text-slate-400">Ingresá los datos del titular para continuar.</p>
              </div>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setCheckoutStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nombre y Apellido</label>
                  <input
                    type="text" required value={holderName} onChange={(e) => setHolderName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">DNI</label>
                  <input
                    type="text" required value={holderDni} onChange={(e) => setHolderDni(e.target.value)}
                    className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Correo Electrónico (Billetera)</label>
                  <input
                    type="email" required value={holderEmail} onChange={(e) => setHolderEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#05070d] border border-white/10 rounded-xl text-white font-bold text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] duration-200 ease-out-strong text-white font-black uppercase text-xs rounded-xl transition-[transform,background-color] cursor-pointer tracking-wider mt-4">
                  Continuar al Pago →
                </button>
              </form>
            </div>
          )}

          {checkoutStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <span>🏷️</span>
                    <span>¿Tienes un cupón?</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="INGRESA EL CÓDIGO" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-4 py-3.5 bg-[#05070d] border border-white/10 rounded-xl text-blue-400 font-black uppercase text-xs focus:outline-none"
                    />
                    <button type="button" onClick={handleApplyCoupon} className="px-6 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 text-white font-black text-xs uppercase rounded-xl transition-[transform,background-color] duration-150 ease-out-strong cursor-pointer">
                      Aplicar
                    </button>
                  </div>
                  {appliedPromoName && <p className="text-xs text-emerald-400 font-bold">✓ Cupón {appliedPromoName} aplicado ({discountPct}% OFF)</p>}
                </div>

                <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-white font-bold text-base">¿Cómo quieres pagar?</h3>
                    <p className="text-xs text-slate-400">Pagas directo al organizador en la nube. <strong className="text-blue-400">Sin cargos extra.</strong></p>
                  </div>

                  <div className="space-y-3">
                    <label
                      onClick={() => setPaymentMethod('mercado_pago')}
                      className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer active:scale-[0.99] transition-colors duration-150 ease-out-strong ${paymentMethod === 'mercado_pago' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#05070d] border-white/5 hover:border-white/20'}`}
                    >
                      <input type="radio" name="payment" checked={paymentMethod === 'mercado_pago'} onChange={() => setPaymentMethod('mercado_pago')} className="mt-1 accent-blue-500" />
                      <div className="space-y-0.5">
                        <span className="text-white font-bold text-sm block">MercadoPago</span>
                        <span className="text-[10px] text-slate-400 block uppercase">Tarjeta de débito, crédito o dinero en cuenta.</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer active:scale-[0.99] transition-colors duration-150 ease-out-strong ${paymentMethod === 'transfer' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#05070d] border-white/5 hover:border-white/20'}`}
                    >
                      <input type="radio" name="payment" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="mt-1 accent-blue-500" />
                      <div className="space-y-0.5">
                        <span className="text-white font-bold text-sm block">Transferencia bancaria</span>
                        <span className="text-[10px] text-slate-400 block uppercase">Subir comprobante.</span>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-300 cursor-pointer">
                      Acepto las <span className="text-blue-400 underline">condiciones generales de compra</span>
                    </label>
                  </div>

                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isProcessing}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] duration-200 ease-out-strong text-white font-black uppercase text-xs rounded-2xl transition-[transform,background-color,box-shadow] cursor-pointer shadow-xl shadow-blue-500/20 tracking-wider disabled:opacity-50"
                  >
                    {isProcessing ? 'Procesando...' : '🔒 Confirmar Orden'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-6 sticky top-24">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-white font-bold text-sm">Tu compra</span>
                  <button onClick={() => setViewMode('details')} className="text-xs text-blue-400 hover:underline">CAMBIAR</button>
                </div>

                <div className="flex gap-4 items-center">
                  <img src={selectedEvent.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  <div className="space-y-0.5">
                    <h4 className="text-white font-bold text-xs line-clamp-1">{selectedEvent.name}</h4>
                    <p className="text-[10px] text-blue-400 font-bold">{selectedEvent.date} · {selectedEvent.startTime} HS</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{selectedEvent.venue}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  {Object.entries(cart).map(([tierName, qty]) => {
                    const t = selectedEvent.tiers.find(t => t.name === tierName);
                    if (!t) return null;
                    return (
                      <div key={tierName} className="flex justify-between items-center">
                        <span className="text-slate-300"><span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mr-1.5 text-[10px]">x{qty}</span> {tierName}</span>
                        <span className="font-bold text-white">${(t.price * qty).toLocaleString('es-AR')}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-bold text-white">${subtotal.toLocaleString('es-AR')}</span>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <span className="text-sm font-bold text-white">Total a pagar</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-400">${finalTotal.toLocaleString('es-AR')}</span>
                    <span className="text-[9px] text-slate-500 block uppercase">ARS</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* MODAL DE FEEDBACK DE COMPRA — reemplaza el alert() nativo del
          navegador (que rompía toda la estética del sitio) por un panel
          acorde: vidrio, esquinas HUD, y un pop de entrada. */}
      {purchaseFeedback && (
        <div
          onClick={() => setPurchaseFeedback(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono"
        >
          <div
            ref={feedbackModalRef}
            onClick={(e) => e.stopPropagation()}
            className="glass glass-edge hud-corners max-w-md w-full rounded-3xl p-8 text-center space-y-5"
          >
            <div
              className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center text-3xl ${
                purchaseFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              {purchaseFeedback.type === 'success' ? '✅' : '⚠️'}
            </div>

            <div className="space-y-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  purchaseFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {purchaseFeedback.type === 'success' ? 'Orden Registrada' : 'No se pudo procesar'}
              </span>
              <h3 className="text-xl font-black uppercase text-white">
                {purchaseFeedback.type === 'success' ? '¡Ya casi está!' : 'Revisá los datos'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{purchaseFeedback.message}</p>
            </div>

            {purchaseFeedback.references && purchaseFeedback.references.length > 0 && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-left text-xs">
                <div className="flex justify-between text-slate-400 gap-3">
                  <span className="shrink-0">Referencia{purchaseFeedback.references.length > 1 ? 's' : ''}:</span>
                  <span className="text-white font-bold text-right">{purchaseFeedback.references.join(', ')}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setPurchaseFeedback(null)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] text-white font-black uppercase text-xs rounded-xl transition-[transform,background-color] duration-150 ease-out-strong shadow-lg shadow-blue-600/30"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050507]/80 backdrop-blur-xl py-6 text-xs font-mono text-slate-500 text-center space-y-1 mt-auto">
        <p className="font-luxury text-blue-400 tracking-widest text-xs font-bold">LIVE EXPERIENCE</p>
      </footer>
    </div>
  );
}