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
  stock?: number;
}

export interface BarOrder {
  id: string;
  token: string;
  eventName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerName: string;
  customerDni: string;
  status: 'pending' | 'delivered' | 'VALID' | 'REDEEMED';
  createdAt: string;
}

const DEFAULT_MENU_ITEMS: BarMenuItem[] = [
  {
    id: 'b-1',
    name: 'Gin Tonic Heredero',
    category: 'Tragos',
    price: 6500,
    description: 'Gin artesanal argentino con tónica premium y piel de pomelo.',
    badge: 'Popular',
    stock: 150,
  },
  {
    id: 'b-2',
    name: 'Fernet Branca XL',
    category: 'Tragos',
    price: 7000,
    description: 'Vaso especial 750cc con Coca-Cola original.',
    badge: 'Clásico',
    stock: 200,
  },
  {
    id: 'b-3',
    name: 'Vodka Smirnoff + Red Bull',
    category: 'Tragos',
    price: 7500,
    description: 'Energizante Red Bull con shot doble de vodka.',
    stock: 100,
  },
  {
    id: 'b-4',
    name: 'Cerveza Corona 330cc',
    category: 'Cervezas',
    price: 4500,
    description: 'Porrón frío con rodaja de lima.',
    stock: 250,
  },
  {
    id: 'b-5',
    name: 'Cerveza Patagonia Amber Ale',
    category: 'Cervezas',
    price: 5000,
    description: 'Cerveza roja de barrica 500cc.',
    stock: 120,
  },
  {
    id: 'b-6',
    name: 'Agua Mineral / Con Gas 500ml',
    category: 'Bebidas',
    price: 2500,
    description: 'Agua embotellada hidratación.',
    stock: 300,
  },
  {
    id: 'b-7',
    name: 'Gaseosa Línea Coca-Cola 354ml',
    category: 'Bebidas',
    price: 3000,
    description: 'Coca-Cola, Sprite o Pomelo.',
    stock: 200,
  },
  {
    id: 'b-8',
    name: 'Combo Sunset: 2 Gin + 1 Agua',
    category: 'Combos',
    price: 13500,
    description: '2 Gin Tonic Heredero + 1 botella de agua.',
    badge: 'Ahorro',
    stock: 80,
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
  const [menuItems, setMenuItems] = useState<BarMenuItem[]>(DEFAULT_MENU_ITEMS);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [selectedPayment, setSelectedPayment] = useState<string>('mp');
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<BarOrder | null>(null);

  useEffect(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('le_local_events') || '[]');
      const activeEvents = storedEvents.length > 0 ? storedEvents : [
        { id: 'ev-1', name: 'LIVE EXPERIENCE Sunset Edition', city: 'Buenos Aires', date: 'Sáb 15 Oct', barMenu: DEFAULT_MENU_ITEMS },
      ];
      setEvents(activeEvents);

      const storedTickets = JSON.parse(
        localStorage.getItem('le_issued_tickets') || 
        localStorage.getItem('oasis_issued_tickets') || '[]'
      );
      setMyTickets(storedTickets);

      if (activeEvents.length > 0) {
        setSelectedEventId(activeEvents[0].id);
        if (activeEvents[0].barMenu && activeEvents[0].barMenu.length > 0) {
          setMenuItems(activeEvents[0].barMenu);
        }
      }
    } catch {
      setSelectedEventId('ev-1');
    }
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || {
    id: 'ev-1',
    name: 'LIVE EXPERIENCE Sunset Edition',
    barMenu: DEFAULT_MENU_ITEMS,
  };

  useEffect(() => {
    if (activeEvent && activeEvent.barMenu && activeEvent.barMenu.length > 0) {
      setMenuItems(activeEvent.barMenu);
    } else {
      setMenuItems(DEFAULT_MENU_ITEMS);
    }
  }, [selectedEventId]);

  const hasTicketForEvent = (eventName: string) => {
    return myTickets.some((t) => (t.eventName || '').toLowerCase() === eventName.toLowerCase());
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const item = menuItems.find(m => m.id === itemId);
    const maxStock = item?.stock ?? 100;

    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      if (next > maxStock) {
        alert(`Stock máximo disponible para ${item?.name}: ${maxStock} unidades.`);
        return prev;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartEntries = Object.entries(cart).map(([itemId, qty]) => {
    const item = menuItems.find((m) => m.id === itemId) || DEFAULT_MENU_ITEMS.find((m) => m.id === itemId)!;
    return { item, quantity: qty };
  });

  const cartTotal = cartEntries.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0);

  const handleCheckout = () => {
    if (cartEntries.length === 0) return;
    setIsOrdering(true);

    setTimeout(() => {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem('le_current_session') ||
          localStorage.getItem('oasis_current_session') ||
          localStorage.getItem('oasis_customer_user') ||
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
          localStorage.getItem('le_bar_orders') || localStorage.getItem('oasis_bar_orders') || '[]'
        );
        const updatedOrders = [newOrder, ...existingOrders];
        localStorage.setItem('le_bar_orders', JSON.stringify(updatedOrders));
        localStorage.setItem('oasis_bar_orders', JSON.stringify(updatedOrders));

        const existingTickets = JSON.parse(
          localStorage.getItem('le_issued_tickets') || 
          localStorage.getItem('oasis_issued_tickets') || '[]'
        );
        const barTicketEntry = {
          id: newOrder.id,
          eventId: activeEvent.id,
          eventName: activeEvent.name,
          tierName: '🍹 Consumición de Barra',
          price: newOrder.total,
          holderName: newOrder.customerName,
          holderDni: newOrder.customerDni,
          holderEmail: storedUser.email || 'cliente@livexp.com',
          qrToken: newOrder.token,
          status: 'VALID',
          isBarOrder: true,
          items: newOrder.items,
          purchaseDate: new Date().toISOString()
        };
        localStorage.setItem('le_issued_tickets', JSON.stringify([barTicketEntry, ...existingTickets]));
        localStorage.setItem('oasis_issued_tickets', JSON.stringify([barTicketEntry, ...existingTickets]));

        const updatedMenuItems = menuItems.map((menuItem) => {
          const purchasedEntry = cartEntries.find((c) => c.item.id === menuItem.id);
          if (purchasedEntry) {
            return {
              ...menuItem,
              stock: Math.max(0, (menuItem.stock ?? 100) - purchasedEntry.quantity),
            };
          }
          return menuItem;
        });

        setMenuItems(updatedMenuItems);

        const storedEvents = JSON.parse(localStorage.getItem('le_local_events') || '[]');
        const updatedEvents = storedEvents.map((ev: any) => {
          if (ev.id === activeEvent.id) {
            return { ...ev, barMenu: updatedMenuItems };
          }
          return ev;
        });
        localStorage.setItem('le_local_events', JSON.stringify(updatedEvents));
        window.dispatchEvent(new Event('storage'));

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
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      {/* TIPOGRAFÍAS DE LUJO */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* NAVBAR */}
      <header className="border-b border-white/5 bg-[#07070a] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20">
              LE
            </div>
            <div className="flex flex-col">
              <span className="font-luxury text-lg font-black tracking-[0.1em] uppercase text-white leading-none group-hover:text-amber-400 transition">
                LIVE EXPERIENCE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition flex items-center gap-2"
            >
              <span>←</span>
              <span className="hidden sm:inline">Cartelera</span>
            </Link>
            <Link
              href="/my-tickets"
              className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-amber-300 font-bold transition flex items-center gap-2"
            >
              <span>💳</span>
              <span className="hidden sm:inline">Billetera</span>
            </Link>
            <div className="pl-2 border-l border-white/10">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-10 flex-1 font-mono">
        
        {/* MODAL ORDEN CONFIRMADA */}
        {createdOrder && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-amber-500/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
                🍸
              </div>

              <div className="space-y-1.5 font-mono">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Consumición Habilitada
                </span>
                <h2 className="font-luxury text-2xl font-black uppercase text-white pt-2">
                  ¡Pedido Realizado con Éxito!
                </h2>
                <p className="text-xs text-slate-300 font-sans">
                  Tu token y QR de barra ya se encuentran guardados en tu <strong className="text-amber-400">Billetera</strong> para el retiro rápido en ventanilla.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 font-mono space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">
                  Token de Canje Inmediato
                </span>
                <span className="text-3xl font-black text-amber-400 tracking-widest block">
                  {createdOrder.token}
                </span>
                <span className="text-[11px] text-slate-400 block pt-1 border-t border-white/5">
                  Evento: {createdOrder.eventName}
                </span>
              </div>

              <div className="space-y-1 text-left font-mono text-xs border-y border-white/10 py-3">
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
                <Link
                  href="/my-tickets"
                  className="flex-1 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-black text-xs uppercase rounded-xl transition shadow-lg shadow-amber-500/20 text-center block"
                >
                  Ir a mi Billetera →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* SELECCIÓN DE EVENTO */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h1 className="font-luxury text-3xl font-black uppercase tracking-tight text-white">
                Barra de Tragos & Bebidas
              </h1>
              <p className="text-xs text-slate-400 font-mono pt-1">
                Seleccioná el evento para retirar en barra sin filas.
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/30 font-bold uppercase self-start sm:self-auto">
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
                  className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between space-y-3 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 text-white'
                      : 'bg-[#0c0f17] border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        📍 {ev.city || 'Buenos Aires'}
                      </span>
                      {hasTicket && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                          🎟️ Tenés Entrada
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-white text-sm block">{ev.name}</span>
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
              {menuItems.map((item) => {
                const qty = cart[item.id] || 0;
                const currentStock = item.stock ?? 100;
                const isOutOfStock = currentStock <= 0;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition shadow-xl"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.badge && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                              {item.badge}
                            </span>
                          )}
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${isOutOfStock ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-slate-300'}`}>
                            Stock: {currentStock}u.
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <p className="text-xs text-slate-400 font-sans leading-snug">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 font-mono">
                      <span className="text-sm font-black text-white">
                        ${item.price.toLocaleString('es-AR')}
                      </span>

                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 rounded-lg border border-white/10 bg-[#07070a] text-white hover:bg-white/10 font-bold flex items-center justify-center transition text-xs cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-xs font-black text-white w-4 text-center">
                              {qty}
                            </span>
                          </>
                        )}
                        <button
                          disabled={isOutOfStock}
                          onClick={() => updateQuantity(item.id, 1)}
                          className={`px-3.5 py-2 font-black text-xs uppercase rounded-xl transition cursor-pointer ${
                            isOutOfStock 
                              ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                          }`}
                        >
                          {isOutOfStock ? 'Agotado' : qty > 0 ? '+' : 'Agregar +'}
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
            <div className="sticky top-24 rounded-3xl bg-[#0c0f17] border border-amber-500/30 p-6 space-y-6 shadow-2xl">
              <div>
                <h2 className="font-luxury text-lg font-black uppercase text-white tracking-wide">
                  Tu Consumición
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {activeEvent?.name}
                </p>
              </div>

              {cartEntries.length === 0 ? (
                <div className="py-10 text-center font-mono space-y-2 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                  <span className="text-3xl block">🍸</span>
                  <p className="text-xs">El carrito de consumición está vacío.</p>
                </div>
              ) : (
                <div className="space-y-5 font-mono">
                  <div className="space-y-2 border-b border-white/10 pb-4 text-xs">
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

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Medio de Pago
                    </span>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedPayment(m.id)}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                            selectedPayment === m.id
                              ? 'bg-amber-500/15 border-amber-500 text-white'
                              : 'bg-[#07070a] border-white/5 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{m.icon}</span>
                            <span className="font-bold text-[11px]">{m.name}</span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
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

                  <div className="pt-2 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Total:</span>
                      <span className="text-2xl font-black text-amber-400">
                        ${cartTotal.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={isOrdering}
                      className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black text-xs uppercase rounded-2xl transition shadow-xl shadow-amber-500/20 disabled:opacity-50 cursor-pointer tracking-wider"
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
      <footer className="border-t border-white/5 bg-[#050507] py-6 text-xs font-mono text-slate-500 text-center space-y-1 mt-auto">
        <p className="font-luxury text-amber-400 tracking-widest text-xs font-bold">LIVE EXPERIENCE</p>
      </footer>
    </div>
  );
}