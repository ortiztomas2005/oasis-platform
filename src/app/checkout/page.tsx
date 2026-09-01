'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface SelectedItem {
  tierName: string;
  tierPrice: number;
  quantity: number;
  entryCutoffTime?: string;
}

interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  rrppCode?: string;
}

type PaymentMethodType = 'mercadopago' | 'card' | 'transfer';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [eventData, setEventData] = useState<EventItem>({
    id: 'ev-default',
    name: 'OASIS SUNSET EDITION',
    date: '15 de Octubre, 2026 · 18:00 HS',
    venue: 'PMRC Puerto Madero, Buenos Aires',
    rrppCode: '',
  });

  const [items, setItems] = useState<SelectedItem[]>([
    { tierName: 'General T1', tierPrice: 15000, quantity: 1, entryCutoffTime: '22:00' },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('mercadopago');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [installments, setInstallments] = useState('1');
  const [transferConfirmed, setTransferConfirmed] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedSelection = localStorage.getItem('oasis_checkout_selection');
      if (savedSelection) {
        const sel = JSON.parse(savedSelection);
        if (sel.items && Array.isArray(sel.items) && sel.items.length > 0) {
          setItems(sel.items);
        }
        if (sel.eventId) {
          setEventData((prev) => ({
            ...prev,
            id: sel.eventId,
            name: sel.eventName || prev.name,
            date: sel.date || prev.date,
            venue: sel.venue || prev.venue,
            rrppCode: sel.rrppCode || '',
          }));
        }
      }
    } catch (e) {
      console.warn('Error leyendo selección en checkout');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/auth?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col items-center justify-center font-mono text-xs space-y-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-400">Verificando sesión...</p>
      </div>
    );
  }

  const totalTickets = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.tierPrice * item.quantity, 0);
  const serviceCharge = paymentMethod === 'transfer' ? 0 : Math.round(subtotal * 0.1);
  const total = subtotal + serviceCharge;

  const handleFinishPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        setErrorMessage('Por favor completá todos los datos de tu tarjeta.');
        return;
      }
    }

    if (paymentMethod === 'transfer' && !transferConfirmed) {
      setErrorMessage('Debés confirmar que realizaste la transferencia para emitir tus pases.');
      return;
    }

    setProcessing(true);

    const generatedTickets: any[] = [];

    items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        const uniqueToken =
          'OASIS-' +
          (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID().slice(0, 8).toUpperCase()
            : Math.random().toString(36).substring(2, 10).toUpperCase()) +
          '-' +
          Date.now().toString(36).toUpperCase();

        const newTicket = {
          id: 'tkt-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
          eventId: eventData.id,
          eventName: eventData.name,
          tierName: item.tierName,
          date: eventData.date,
          venue: eventData.venue,
          holderName: user.name,
          holderDni: user.dni,
          holderEmail: user.email,
          qrToken: uniqueToken,
          status: 'VALID',
          entryCutoffTime: item.entryCutoffTime || '',
          rrppCode: eventData.rrppCode || '',
          purchaseDate: new Date().toISOString(),
          price: item.tierPrice,
          paymentMethod,
        };

        generatedTickets.push(newTicket);
      }
    });

    try {
      const existing = localStorage.getItem('oasis_issued_tickets');
      const tickets = existing ? JSON.parse(existing) : [];
      const updatedTickets = [...generatedTickets, ...tickets];
      localStorage.setItem('oasis_issued_tickets', JSON.stringify(updatedTickets));
    } catch (e) {
      console.warn('Error guardando tickets');
    }

    setTimeout(() => {
      setProcessing(false);
      setConfirmed(true);
      setTimeout(() => {
        router.push('/my-tickets');
      }, 1000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-neutral-800/60 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              O
            </div>
            <div>
              <span className="text-xs font-black tracking-widest uppercase block">OASIS</span>
              <span className="text-[10px] text-blue-400 font-mono">Secure Payment Checkout</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 font-mono text-xs text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-white font-bold uppercase">{user.name}</span>
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8 flex-1 font-mono">
        <div className="border-b border-neutral-800/80 pb-4">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block">
            ● Transacción Encriptada SSL 256-Bit
          </span>
          <h1 className="text-2xl font-black uppercase text-white tracking-wide">
            Finalizar Compra de Pases
          </h1>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300 text-xs font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleFinishPurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: DATOS DEL TITULAR + MEDIOS DE PAGO */}
          <div className="lg:col-span-7 space-y-6">
            {/* DATOS TITULAR */}
            <div className="bg-[#090d16] border border-neutral-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
              <span className="text-xs uppercase font-black text-neutral-300 tracking-wider block">
                Titular Nominativo del Pase
              </span>

              <div className="grid grid-cols-2 gap-4 bg-black/50 p-4 rounded-2xl border border-neutral-800">
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block font-bold">Nombre</span>
                  <span className="text-xs font-black text-white uppercase block mt-0.5">{user.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block font-bold">DNI Nominativo</span>
                  <span className="text-xs font-black text-blue-400 block mt-0.5">{user.dni}</span>
                </div>
              </div>
            </div>

            {/* SELECTOR DE MEDIOS DE PAGO */}
            <div className="bg-[#090d16] border border-neutral-800/80 rounded-3xl p-6 space-y-5 shadow-xl">
              <span className="text-xs uppercase font-black text-neutral-300 tracking-wider block border-b border-neutral-800/80 pb-3">
                Seleccioná tu Método de Pago
              </span>

              <div className="grid grid-cols-1 gap-3">
                {/* MERCADO PAGO */}
                <div
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'mercadopago'
                      ? 'bg-blue-950/30 border-blue-500 shadow-md shadow-blue-600/10'
                      : 'bg-black/30 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#009ee3]/20 border border-[#009ee3]/40 flex items-center justify-center text-lg font-bold text-[#009ee3]">
                      MP
                    </div>
                    <div>
                      <span className="text-xs font-black text-white uppercase block">Mercado Pago</span>
                      <span className="text-[10px] text-neutral-400">
                        Dinero en cuenta, Débito o Cuotas con MP
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'mercadopago'}
                    onChange={() => setPaymentMethod('mercadopago')}
                    className="accent-blue-600"
                  />
                </div>

                {/* TARJETA DE CRÉDITO / DÉBITO DIRECTA */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'bg-blue-950/30 border-blue-500 shadow-md shadow-blue-600/10'
                      : 'bg-black/30 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-lg">
                      💳
                    </div>
                    <div>
                      <span className="text-xs font-black text-white uppercase block">
                        Tarjeta de Crédito / Débito
                      </span>
                      <span className="text-[10px] text-neutral-400">Visa, Mastercard, Cabal, Amex</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-blue-600"
                  />
                </div>

                {/* TRANSFERENCIA / CVU DIRECTO */}
                <div
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'transfer'
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-600/10'
                      : 'bg-black/30 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">
                      🏦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase">Transferencia / CVU</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          0% Service Charge
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        Acreditación y emisión inmediata
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="accent-emerald-500"
                  />
                </div>
              </div>

              {/* CAMPOS DINÁMICOS SEGÚN EL MÉTODO */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 pt-4 border-t border-neutral-800 text-xs animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase font-bold">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      placeholder="4509 •••• •••• ••••"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase font-bold">
                      Nombre y Apellido del Titular
                    </label>
                    <input
                      type="text"
                      placeholder="COMO FIGURA EN EL PLÁSTICO"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 uppercase font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase font-bold">
                        Vencimiento
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase font-bold">
                        Código de Seguridad (CVV)
                      </label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase font-bold">
                      Plan de Cuotas
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-3 text-white outline-none focus:border-blue-500 font-mono text-xs"
                    >
                      <option value="1">1 pago de ${total.toLocaleString('es-AR')}</option>
                      <option value="3">3 cuotas fijas de ${Math.round(total / 3).toLocaleString('es-AR')}</option>
                      <option value="6">6 cuotas fijas de ${Math.round((total * 1.15) / 6).toLocaleString('es-AR')}</option>
                    </select>
                  </div>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="space-y-4 pt-4 border-t border-neutral-800 text-xs animate-fade-in">
                  <div className="bg-black/50 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                      Datos de Transferencia Oficial OASIS
                    </span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400">Alias:</span>
                      <strong className="text-white font-mono bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                        OASIS.PAGOS.OFICIAL
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400">CBU / CVU:</span>
                      <strong className="text-neutral-300 font-mono">0000003100045982109432</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400">Titular:</span>
                      <strong className="text-neutral-300 uppercase">Oasis Live S.A.</strong>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={transferConfirmed}
                      onChange={(e) => setTransferConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded mt-0.5"
                    />
                    <span className="text-[11px] text-neutral-300 font-sans">
                      Confirmo que realicé la transferencia por el monto exacto de{' '}
                      <strong className="text-emerald-400">${total.toLocaleString('es-AR')}</strong>.
                    </span>
                  </label>
                </div>
              )}

              {paymentMethod === 'mercadopago' && (
                <div className="pt-2 text-[11px] text-neutral-400 font-sans bg-black/30 p-3.5 rounded-xl border border-neutral-800">
                  ⚡ Serás procesado a través del Checkout Seguro de Mercado Pago con dinero en cuenta, débito o crédito.
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN DE COMPRA & CTA */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#090d16] border border-neutral-800/80 rounded-3xl p-6 space-y-5 shadow-2xl sticky top-24">
              <span className="text-xs uppercase font-black text-neutral-300 tracking-wider block border-b border-neutral-800/80 pb-3">
                Resumen de tu Orden
              </span>

              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-white">{eventData.name}</h3>
                <p className="text-[11px] text-neutral-400">📍 {eventData.venue}</p>
                {eventData.rrppCode && (
                  <span className="text-[10px] text-indigo-400 font-bold block pt-1">
                    👥 Venta asignada al embajador: @{eventData.rrppCode}
                  </span>
                )}
              </div>

              {/* DETALLE TANDAS */}
              <div className="space-y-2 bg-black/40 p-3.5 rounded-2xl border border-neutral-800">
                {items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 border-b border-neutral-800/60 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white">
                        <strong className="text-blue-400">{item.quantity}x</strong> {item.tierName}
                      </span>
                      <span className="font-bold text-neutral-300">
                        ${(item.tierPrice * item.quantity).toLocaleString('es-AR')}
                      </span>
                    </div>
                    {item.entryCutoffTime ? (
                      <span className="text-[10px] text-amber-400 block">
                        ⏰ Válido para ingresar hasta las {item.entryCutoffTime} HS
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 block">
                        ⏰ Acceso All-Night
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* TOTALES */}
              <div className="space-y-2 pt-2 text-xs border-t border-neutral-800/80">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">${subtotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>Cargos de servicio {paymentMethod === 'transfer' ? '(Bonificado)' : '(10%)'}</span>
                  <span className={paymentMethod === 'transfer' ? 'text-emerald-400 font-bold' : ''}>
                    ${serviceCharge.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-white">
                  <span className="text-xs uppercase font-bold">Total a Pagar</span>
                  <span className="text-xl font-black text-emerald-400">
                    ${total.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* BOTÓN DE CONFIRMACIÓN */}
              <button
                type="submit"
                disabled={processing || confirmed || totalTickets === 0}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black uppercase rounded-2xl transition-all shadow-xl shadow-blue-600/30 text-xs hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {confirmed ? (
                  '✓ ¡PAGO APROBADO · EMITIENDO PASES!'
                ) : processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Procesando Pago Seguro...</span>
                  </>
                ) : (
                  `Pagar $${total.toLocaleString('es-AR')} (${totalTickets} pases) →`
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      <footer className="border-t border-neutral-800/60 py-6 text-center text-[10px] text-neutral-500 font-mono">
        © 2026 OASIS Platform · Gateway de Pagos Oficial
      </footer>
    </div>
  );
}