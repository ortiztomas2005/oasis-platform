'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

export interface BarMenuItem {
  id: string;
  name: string;
  category: 'Tragos' | 'Cervezas' | 'Bebidas' | 'Combos';
  price: number;
  description: string;
  badge?: string;
}

export interface BarOrder {
  id: string;
  token: string;
  eventName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerName: string;
  customerDni: string;
  status: 'pending' | 'delivered';
  createdAt: string;
}

const MENU_ITEMS: BarMenuItem[] = [
  {
    id: 'b-1',
    name: 'Gin Tonic Heredero',
    category: 'Tragos',
    price: 6500,
    description: 'Gin artesanal argentino con tónica premium y piel de pomelo.',
    badge: 'Popular',
  },
  {
    id: 'b-2',
    name: 'Fernet Branca XL',
    category: 'Tragos',
    price: 7000,
    description: 'Vaso especial 750cc con Coca-Cola original.',
    badge: 'Clásico',
  },
  {
    id: 'b-3',
    name: 'Vodka Smirnoff + Red Bull',
    category: 'Tragos',
    price: 7500,
    description: 'Energizante Red Bull con shot doble de vodka.',
  },
  {
    id: 'b-4',
    name: 'Cerveza Corona 330cc',
    category: 'Cervezas',
    price: 4500,
    description: 'Porrón frío con rodaja de lima.',
  },
  {
    id: 'b-5',
    name: 'Cerveza Patagonia Amber Ale',
    category: 'Cervezas',
    price: 5000,
    description: 'Cerveza roja de barrica 500cc.',
  },
  {
    id: 'b-6',
    name: 'Agua Mineral / Con Gas 500ml',
    category: 'Bebidas',
    price: 2500,
    description: 'Agua embotellada hidratación.',
  },
  {
    id: 'b-7',
    name: 'Gaseosa Línea Coca-Cola 354ml',
    category: 'Bebidas',
    price: 3000,
    description: 'Coca-Cola, Sprite o Pomelo.',
  },
  {
    id: 'b-8',
    name: 'Combo Sunset: 2 Gin + 1 Agua',
    category: 'Combos',
    price: 13500,
    description: '2 Gin Tonic Heredero + 1 botella de agua.',
    badge: 'Ahorro',
  },
];

const PAYMENT_METHODS = [
  { id: 'mp', name: 'Mercado Pago', icon: '💙' },
  { id: 'card', name: 'Tarjeta de Débito / Crédito', icon: '💳' },
  { id: 'transfer', name: 'Transferencia Bancaria / MODO', icon: '⚡' },
];

export default function BarCustomerPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [selectedPayment, setSelectedPayment] = useState<string>('mp');
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<BarOrder | null>(null);

  // Cargar eventos y entradas adquiridas del usuario
  useEffect(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('oasis_local_events') || '[]');
      setEvents(storedEvents.length > 0 ? storedEvents : [
        { id: 'ev-1', name: 'OASIS Sunset Edition', city: 'Buenos Aires', date: 'Sáb 15 Oct' },
        { id: 'ev-2', name: 'Neo Warehouse Nightline', city: 'Buenos Aires', date: 'Vie 28 Nov' },
        { id: 'ev-3', name: 'Patagonia Bass & Beats', city: 'Puerto Madryn', date: 'Sáb 12 Dic' },
      ]);

      const storedTickets = JSON.parse(localStorage.getItem('oasis_tickets') || '[]');
      setMyTickets(storedTickets);

      // Si tiene tickets, preselecciona el evento de su ticket
      if (storedTickets.length > 0) {
        const ticketEventName = storedTickets[storedTickets.length - 1].eventName;
        const matched = (storedEvents.length > 0 ? storedEvents : []).find(
          (e: any) => e.name === ticketEventName
        );
        if (matched) {
          setSelectedEventId(matched.id);
        } else if (storedEvents.length > 0) {
          setSelectedEventId(storedEvents[0].id);
        }
      } else if (storedEvents.length > 0) {
        setSelectedEventId(storedEvents[0].id);
      } else {
        setSelectedEventId('ev-1');
      }
    } catch {
      setSelectedEventId('ev-1');
    }
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || {
    id: 'ev-1',
    name: 'OASIS Sunset Edition',
  };

  const hasTicketForEvent = (eventName: string) => {
    return myTickets.some((t) => t.eventName === eventName);
  };

  // Manejo de carrito
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartEntries = Object.entries(cart).map(([itemId, qty]) => {
    const item = MENU_ITEMS.find((m) => m.id === itemId)!;
    return { item, quantity: qty };
  });

  const cartTotal = cartEntries.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0);

  // Realizar pedido y guardar orden
  const handleCheckout = () => {
    if (cartEntries.length === 0) return;
    setIsOrdering(true);

    setTimeout(() => {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem('oasis_current_user') ||
            JSON.stringify({ name: 'Santiago Rossi', dni: '42.190.231' })
        );

        const randToken = `BR-${Math.floor(1000 + Math.random() * 9000)}`;
        const now =
          new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' HS';

        const newOrder: BarOrder = {
          id: `ord-${Date.now()}`,
          token: randToken,
          eventName: activeEvent.name,
          items: cartEntries.map(({ item, quantity }) => ({
            name: item.name,
            quantity,
            price: item.price,
          })),
          total: cartTotal,
          customerName: storedUser.name || 'Santiago Rossi',
          customerDni: storedUser.dni || '42.190.231',
          status: 'pending',
          createdAt: now,
        };

        const existingOrders: BarOrder[] = JSON.parse(
          localStorage.getItem('oasis_bar_orders') || '[]'
        );
        localStorage.setItem('oasis_bar_orders', JSON.stringify([newOrder, ...existingOrders]));

        setIsOrdering(false);
        setCreatedOrder(newOrder);
        setCart({});
      } catch (err) {
        console.error(err);
        setIsOrdering(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-[#0f131c]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#161a26] hover:border-slate-700 text-slate-300 text-xs font-mono font-bold transition flex items-center gap-2"
            >
              <span>←</span>
              <span>Cartelera</span>
            </Link>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-white leading-none">
                OASIS
              </span>
              <span className="text-[9px] text-amber-400 font-mono tracking-wider mt-0.5">
                BARRA & CONSUMO EXPRESS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#161a26] hover:border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Panel Productora</span>
            </Link>
            <div className="pl-1.5 border-l border-slate-800">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8 flex-1">
        {/* MODAL ORDEN CONFIRMADA */}
        {createdOrder && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-3xl bg-[#131722] border border-amber-500/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
                🍸
              </div>

              <div className="space-y-1.5 font-mono">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Consumición Habilitada
                </span>
                <h2 className="text-2xl font-black uppercase text-white pt-2">
                  ¡Pedido Listo para Retiro!
                </h2>
                <p className="text-xs text-slate-400">
                  Mostrá este código en la ventanilla de la barra.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 font-mono space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">
                  Código de Canje
                </span>
                <span className="text-3xl font-black text-amber-400 tracking-widest block">
                  {createdOrder.token}
                </span>
                <span className="text-[11px] text-slate-400 block pt-1 border-t border-white/5">
                  Evento: {createdOrder.eventName}
                </span>
              </div>

              <div className="space-y-1 text-left font-mono text-xs border-y border-slate-800/80 py-3">
                {createdOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-slate-300">
                    <span>
                      {it.quantity}x {it.name}
                    </span>
                    <span className="text-slate-400">${(it.price * it.quantity).toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 font-mono">
                <button
                  onClick={() => setCreatedOrder(null)}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition shadow-lg shadow-amber-500/30"
                >
                  Aceptar y Seguir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SELECCIÓN DE EVENTO */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                Barra de Tragos & Bebidas
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Seleccioná el evento para retirar en barra sin filas.
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 font-bold uppercase self-start sm:self-auto">
              ⚡ Fast Lane QR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            {events.map((ev) => {
              const hasTicket = hasTicketForEvent(ev.name);
              const isSelected = selectedEventId === ev.id;

              return (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setCart({});
                  }}
                  className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-[#131722] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        📍 {ev.city}
                      </span>
                      {hasTicket && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                          🎟️ Tenés Entrada
                        </span>
                      )}
                    </div>
                    <span className="font-black text-white text-sm block">{ev.name}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 block">
                    {hasTicket ? 'Listo para retirar consumición' : 'Evento habilitado'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* CARTA DE TRAGOS + CARRITO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CARTA DE PRODUCTOS */}
          <div className="lg:col-span-8 space-y-4">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider block">
              Menú Disponible · {activeEvent?.name}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MENU_ITEMS.map((item) => {
                const qty = cart[item.id] || 0;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#131722] border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <p className="text-xs text-slate-400 font-sans leading-snug">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 font-mono">
                      <span className="text-sm font-black text-white">
                        ${item.price.toLocaleString('es-AR')}
                      </span>

                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 rounded-lg border border-slate-800 bg-[#181d2a] text-white hover:bg-slate-800 font-bold flex items-center justify-center transition text-xs"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-white w-4 text-center">
                              {qty}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-lg transition"
                        >
                          {qty > 0 ? '+' : 'Agregar +'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHECKOUT DEL CARRITO DE BARRA */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl bg-[#131722] border border-slate-800/80 p-6 space-y-6 shadow-xl">
              <div>
                <h2 className="text-lg font-black uppercase text-white tracking-wide">
                  Tu Consumición
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {activeEvent?.name}
                </p>
              </div>

              {cartEntries.length === 0 ? (
                <div className="py-10 text-center font-mono space-y-2 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <span className="text-3xl block">🍸</span>
                  <p className="text-xs">El carrito de consumición está vacío.</p>
                </div>
              ) : (
                <div className="space-y-5 font-mono">
                  {/* Lista de Items */}
                  <div className="space-y-2 border-b border-slate-800 pb-4 text-xs">
                    {cartEntries.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center justify-between text-slate-300">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">{item.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {quantity} x ${item.price.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <span className="font-bold text-white">
                          ${(item.price * quantity).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Medios de Pago */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Medio de Pago
                    </span>
                    <div className="space-y-1.5">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedPayment(m.id)}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                            selectedPayment === m.id
                              ? 'bg-amber-500/10 border-amber-500 text-white'
                              : 'bg-[#181d2a] border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{m.icon}</span>
                            <span className="font-bold text-[11px]">{m.name}</span>
                          </div>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              selectedPayment === m.id
                                ? 'border-amber-500 bg-amber-500'
                                : 'border-slate-600'
                            }`}
                          >
                            {selectedPayment === m.id && (
                              <div className="w-1.5 h-1.5 rounded-full bg-black" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Total:</span>
                      <span className="text-xl font-black text-amber-400">
                        ${cartTotal.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={isOrdering}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      {isOrdering
                        ? 'Procesando pedido...'
                        : `Pagar y Generar Token · $${cartTotal.toLocaleString('es-AR')} →`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0c0f16] py-6 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>OASIS LIVE · Fast Lane Bar & Consumption</span>
          <span className="text-[11px] text-slate-400">Retiro Inmediato con Token Digital</span>
        </div>
      </footer>
    </div>
  );
}