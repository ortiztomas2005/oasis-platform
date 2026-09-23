'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserMenu from '@/components/UserMenu';
import { createClient } from '@/core/supabase/client';
import { useSession } from '@/core/auth/useSession';

const supabase = createClient();

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
        // Antes esto consultaba status='ACTIVE' y el join 'event_tiers' —
        // ninguno de los dos existe de verdad: los eventos reales se crean
        // con status 'PUBLISHED' (ver /api/producers/events) y la tabla de
        // tandas se llama 'ticket_tiers'. Por eso nunca aparecía nada acá
        // aunque la productora tuviera eventos publicados.
        const { data: dbEvents, error } = await supabase
          .from('events')
          .select('*, ticket_tiers(*)')
          .in('status', ['PUBLISHED', 'ACTIVE'])
          .order('date', { ascending: true });

        if (error) {
          console.error('❌ Detalle del error de Supabase:', error.message, error.details, error.hint);
          setEvents([]);
          return;
        }

        if (dbEvents && dbEvents.length > 0) {
          // La tabla real solo tiene un timestamp único 'date' (no
          // start_time/end_time separados como esperaba este mapeo viejo),
          // así que la fecha y la hora para mostrar se derivan de ahí.
          const formattedEvents: EventItem[] = dbEvents.map((ev: any) => {
            const eventDate = ev.date ? new Date(ev.date) : null;
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
              tiers: (ev.ticket_tiers || []).map((t: any) => ({
                name: t.name,
                price: t.price,
                capacity: t.available_capacity ?? t.total_capacity ?? t.capacity ?? 0,
                showStockToClients: t.show_stock_to_clients ?? true,
                scarcityThreshold: t.low_stock_threshold ?? 10,
                status: t.status,
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
    if (!holderName || !holderDni || !holderEmail) return alert('Por favor completá tus datos.');
    if (!acceptedTerms) return alert('Debes aceptar las condiciones generales de compra.');
    if (!selectedEvent || totalTickets === 0) return alert('Tu carrito está vacío.');

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
      alert(
        `Orden${orderReferences.length > 1 ? 'es' : ''} registrada${orderReferences.length > 1 ? 's' : ''}: ${orderReferences.join(', ')}.\n` +
          'Tu compra quedó en revisión — vas a ver tus pases en "Mis Entradas" apenas se confirme el pago.'
      );
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      alert('Error al procesar la compra: ' + err.message);
    }
  };

  const featuredEvent = events[featuredIndex] || events[0];

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* NAVBAR */}
      <header className="border-b border-white/5 bg-[#07070a] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" onClick={() => setViewMode('catalog')} className="flex items-center gap-3.5 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20">
              LE
            </div>
            <div className="flex flex-col">
              <span className="font-luxury text-lg font-black tracking-[0.1em] uppercase text-white leading-none group-hover:text-amber-400 transition">
                LIVE EXPERIENCE
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-4 font-mono text-xs">
            <button
              onClick={() => { window.location.href = '/club/partidos'; }}
              className="text-amber-400 hover:text-amber-300 transition font-bold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer"
            >
              <span>⚽</span> Deporte
            </button>

            <Link href="/resale" className="text-slate-300 hover:text-amber-400 font-bold transition">Resale</Link>
            <Link href="/bar" className="text-slate-300 hover:text-amber-400 font-bold transition">Barra</Link>
            <Link href="/my-tickets" className="px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold transition hover:bg-amber-500/20">
              💳 Billetera
            </Link>
            
            {userProducerName ? (
              <button 
                onClick={() => router.push('/admin')}
                className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <span>📊</span> Ir a Panel ({userProducerName})
              </button>
            ) : (
              <Link
                href="/auth?redirect=/"
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
              >
                🏢 Crear / Iniciar Productora
              </Link>
            )}

            <div className="pl-2 border-l border-white/10"><UserMenu /></div>
          </div>
        </div>
      </header>

      {/* VISTA CARTELERA */}
      {viewMode === 'catalog' && (
        <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-12 flex-1">
          {events.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-[#0c0f17] border border-white/5 space-y-3 my-auto">
              <span className="text-3xl">🗓️</span>
              <h3 className="font-luxury text-lg font-bold text-white uppercase">No hay eventos activos en la cartelera</h3>
              <p className="text-xs text-slate-400">Creá una productora y publicá tu primer evento para verlo reflejado aquí.</p>
              
              {userProducerName ? (
                <button 
                  onClick={() => router.push('/admin')}
                  className="mt-2 px-6 py-3 bg-amber-500 text-black font-black text-xs uppercase rounded-xl cursor-pointer shadow-lg"
                >
                  Ir al Panel de {userProducerName} 📊
                </button>
              ) : (
                <Link
                  href="/auth?redirect=/"
                  className="mt-2 inline-block px-6 py-3 bg-amber-500 text-black font-black text-xs uppercase rounded-xl cursor-pointer shadow-lg"
                >
                  Registrar Productora
                </Link>
              )}
            </div>
          ) : (
            <>
              {featuredEvent && (
                <section 
                  onClick={() => goToDetails(featuredEvent)}
                  className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-[#0c0f17] shadow-2xl group cursor-pointer"
                >
                  <div className="absolute inset-0 z-0">
                    <img
                      src={featuredEvent.imageUrl}
                      alt={featuredEvent.name}
                      className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/60 to-transparent" />
                  </div>

                  <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-end min-h-[380px] space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                        ★ Destacado
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">{featuredEvent.venue} · {featuredEvent.city}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-amber-400 font-mono font-bold uppercase tracking-widest block">
                        {featuredEvent.date} — {featuredEvent.startTime} HS
                      </span>
                      <h1 className="font-luxury text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
                        {featuredEvent.name}
                      </h1>
                    </div>

                    <div className="pt-2 flex items-center gap-4 font-mono">
                      <span className="px-8 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wider inline-block">
                        Ver Evento y Tickets →
                      </span>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest block">● Próximas Fechas</span>
                  <h2 className="font-luxury text-2xl font-bold uppercase text-white tracking-wider">Cartelera General</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-2xl bg-[#0c0f17] border border-white/5 hover:border-amber-500/40 transition-all duration-300 flex flex-col overflow-hidden shadow-xl group cursor-pointer"
                      onClick={() => goToDetails(ev)}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={ev.imageUrl}
                          alt={ev.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-85"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f17] via-transparent to-transparent" />
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase">
                          📍 {ev.city}
                        </span>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] text-amber-400 font-mono font-bold uppercase tracking-wider block">
                            {ev.date}
                          </span>
                          <h3 className="font-luxury text-base font-bold text-white leading-snug">
                            {ev.name}
                          </h3>
                        </div>

                        <div className="w-full py-2.5 bg-white/5 group-hover:bg-amber-500 border border-white/10 group-hover:border-amber-500 text-slate-300 group-hover:text-black font-black text-[11px] uppercase rounded-xl transition font-mono tracking-wider text-center">
                          Ver Información & Tickets →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      )}

      {/* VISTA DETALLES */}
      {viewMode === 'details' && selectedEvent && (
        <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-1 animate-fade-in font-mono">
          <button 
            onClick={() => setViewMode('catalog')} 
            className="text-xs text-slate-400 hover:text-amber-400 transition mb-6 block cursor-pointer font-bold"
          >
            ← Volver a la Cartelera
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img src={selectedEvent.imageUrl} alt={selectedEvent.name} className="w-full h-auto object-cover" />
              </div>
              <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-3 text-xs">
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
                <span className="text-xs uppercase font-bold text-amber-400 block tracking-widest">Seleccioná tus Tickets</span>
                
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
                          
                          <div className="flex items-center gap-3 bg-[#07070a] border border-white/10 rounded-full px-2 py-1">
                            <button onClick={() => updateCart(tier.name, -1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-white font-black transition cursor-pointer">
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-white">{qty}</span>
                            <button onClick={() => updateCart(tier.name, 1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-white font-black transition cursor-pointer">
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
                      className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl transition shadow-xl shadow-amber-500/20 cursor-pointer tracking-wider"
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
        <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 animate-fade-in font-mono space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px]">✓</span>
              <span>TICKETS</span>
            </div>
            <div className="flex-1 h-[1px] mx-4 bg-slate-800" />
            <div className={`flex items-center gap-2 text-xs font-bold ${isLoggedIn ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isLoggedIn ? 'bg-emerald-500/25 border border-emerald-500' : 'bg-amber-500/25 border border-amber-500'}`}>
                {isLoggedIn ? '✓' : '●'}
              </span>
              <span>TUS DATOS {isLoggedIn ? '(REGISTRADO)' : ''}</span>
            </div>
            <div className="flex-1 h-[1px] mx-4 bg-slate-800" />
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-500/25 border border-amber-500 flex items-center justify-center text-[10px]">03</span>
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
                    className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">DNI</label>
                  <input
                    type="text" required value={holderDni} onChange={(e) => setHolderDni(e.target.value)}
                    className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Correo Electrónico (Billetera)</label>
                  <input
                    type="email" required value={holderEmail} onChange={(e) => setHolderEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl transition cursor-pointer tracking-wider mt-4">
                  Continuar al Pago →
                </button>
              </form>
            </div>
          )}

          {checkoutStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <span>🏷️</span>
                    <span>¿Tienes un cupón?</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="INGRESA EL CÓDIGO" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-4 py-3.5 bg-[#07070a] border border-white/10 rounded-xl text-amber-400 font-black uppercase text-xs focus:outline-none"
                    />
                    <button type="button" onClick={handleApplyCoupon} className="px-6 py-3.5 bg-slate-300 hover:bg-white text-black font-black text-xs uppercase rounded-xl transition cursor-pointer">
                      Aplicar
                    </button>
                  </div>
                  {appliedPromoName && <p className="text-xs text-emerald-400 font-bold">✓ Cupón {appliedPromoName} aplicado ({discountPct}% OFF)</p>}
                </div>

                <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-white font-bold text-base">¿Cómo quieres pagar?</h3>
                    <p className="text-xs text-slate-400">Pagas directo al organizador en la nube. <strong className="text-amber-400">Sin cargos extra.</strong></p>
                  </div>

                  <div className="space-y-3">
                    <label 
                      onClick={() => setPaymentMethod('mercado_pago')}
                      className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition ${paymentMethod === 'mercado_pago' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-[#07070a] border-white/5 hover:border-white/20'}`}
                    >
                      <input type="radio" name="payment" checked={paymentMethod === 'mercado_pago'} onChange={() => setPaymentMethod('mercado_pago')} className="mt-1 accent-amber-500" />
                      <div className="space-y-0.5">
                        <span className="text-white font-bold text-sm block">MercadoPago</span>
                        <span className="text-[10px] text-slate-400 block uppercase">Tarjeta de débito, crédito o dinero en cuenta.</span>
                      </div>
                    </label>

                    <label 
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition ${paymentMethod === 'transfer' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-[#07070a] border-white/5 hover:border-white/20'}`}
                    >
                      <input type="radio" name="payment" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="mt-1 accent-amber-500" />
                      <div className="space-y-0.5">
                        <span className="text-white font-bold text-sm block">Transferencia bancaria</span>
                        <span className="text-[10px] text-slate-400 block uppercase">Subir comprobante.</span>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-300 cursor-pointer">
                      Acepto las <span className="text-amber-400 underline">condiciones generales de compra</span>
                    </label>
                  </div>

                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isProcessing}
                    className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-2xl transition cursor-pointer shadow-xl shadow-amber-500/20 tracking-wider disabled:opacity-50"
                  >
                    {isProcessing ? 'Procesando...' : '🔒 Confirmar Orden'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#0c0f16] border border-white/10 rounded-3xl p-6 space-y-6 sticky top-24">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-white font-bold text-sm">Tu compra</span>
                  <button onClick={() => setViewMode('details')} className="text-xs text-amber-400 hover:underline">CAMBIAR</button>
                </div>

                <div className="flex gap-4 items-center">
                  <img src={selectedEvent.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  <div className="space-y-0.5">
                    <h4 className="text-white font-bold text-xs line-clamp-1">{selectedEvent.name}</h4>
                    <p className="text-[10px] text-amber-400 font-bold">{selectedEvent.date} · {selectedEvent.startTime} HS</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{selectedEvent.venue}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  {Object.entries(cart).map(([tierName, qty]) => {
                    const t = selectedEvent.tiers.find(t => t.name === tierName);
                    if (!t) return null;
                    return (
                      <div key={tierName} className="flex justify-between items-center">
                        <span className="text-slate-300"><span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold mr-1.5 text-[10px]">x{qty}</span> {tierName}</span>
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
                    <span className="text-2xl font-black text-amber-400">${finalTotal.toLocaleString('es-AR')}</span>
                    <span className="text-[9px] text-slate-500 block uppercase">ARS</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#050507] py-6 text-xs font-mono text-slate-500 text-center space-y-1 mt-auto">
        <p className="font-luxury text-amber-400 tracking-widest text-xs font-bold">LIVE EXPERIENCE</p>
      </footer>
    </div>
  );
}