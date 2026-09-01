'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mp' | 'transfer'>('mp');

  // Si no está autenticado, redirigir a login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center font-mono text-xs">
        Redirigiendo al login...
      </div>
    );
  }

  const handleFinishPurchase = () => {
    setProcessing(true);

    // Crear tickets emitidos para el usuario
    const newTicket = {
      id: 'tkt-' + Date.now(),
      eventId: 'ev-default',
      eventName: 'OASIS SUNSET EDITION',
      tierName: 'General T1',
      date: '15 de Octubre, 2026',
      venue: 'PMRC Puerto Madero, Buenos Aires',
      holderName: user.name,
      holderDni: user.dni,
      holderEmail: user.email,
      qrToken: 'OASIS-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      status: 'VALID',
      purchaseDate: new Date().toISOString(),
      price: 15000,
    };

    try {
      const existing = localStorage.getItem('oasis_issued_tickets');
      const tickets = existing ? JSON.parse(existing) : [];
      tickets.push(newTicket);
      localStorage.setItem('oasis_issued_tickets', JSON.stringify(tickets));
    } catch (e) {}

    setTimeout(() => {
      setProcessing(false);
      router.push('/my-tickets');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* HEADER */}
      <header className="border-b border-neutral-800/60 bg-[#090d16]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30">
              O
            </div>
            <div>
              <span className="text-xs font-black tracking-widest uppercase block">OASIS</span>
              <span className="text-[10px] text-neutral-500 font-mono">Secure Checkout</span>
            </div>
          </Link>
          <div className="text-xs font-mono text-neutral-400">
            👤 <span className="text-white font-bold">{user.name}</span>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6 flex-1 font-mono">
        <div className="border-b border-neutral-800 pb-4">
          <h1 className="text-xl font-black uppercase text-white tracking-wide">Finalizar Compra</h1>
          <p className="text-xs text-neutral-400">Revisá los datos del titular y elegí la forma de pago.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* DATOS DEL COMPRADOR Y PAGO */}
          <div className="md:col-span-7 space-y-4">
            {/* DATOS TITULAR */}
            <div className="bg-[#090d16] border border-neutral-800 rounded-2xl p-5 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                1. Titular de los Pases (Nominativo)
              </span>
              <div className="grid grid-cols-2 gap-3 bg-black/40 p-3.5 rounded-xl border border-neutral-800/80">
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">Nombre</span>
                  <span className="font-bold text-white uppercase">{user.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">DNI / Documento</span>
                  <span className="font-bold text-blue-400">{user.dni}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-neutral-800">
                  <span className="text-[9px] text-neutral-500 uppercase block">Email de confirmación</span>
                  <span className="text-neutral-300 font-sans">{user.email}</span>
                </div>
              </div>
            </div>

            {/* MÉTODO DE PAGO */}
            <div className="bg-[#090d16] border border-neutral-800 rounded-2xl p-5 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                2. Método de Pago
              </span>

              <div className="space-y-2">
                <label
                  onClick={() => setPaymentMethod('mp')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'mp' ? 'bg-blue-950/20 border-blue-500 text-white' : 'border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'mp'} onChange={() => {}} />
                    <span className="font-bold text-xs">Mercado Pago / Débito / Crédito</span>
                  </div>
                  <span className="text-xs">💳</span>
                </label>

                <label
                  onClick={() => setPaymentMethod('transfer')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'transfer' ? 'bg-blue-950/20 border-blue-500 text-white' : 'border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'transfer'} onChange={() => {}} />
                    <span className="font-bold text-xs">Transferencia Bancaria Inmediata</span>
                  </div>
                  <span className="text-xs">⚡</span>
                </label>
              </div>
            </div>
          </div>

          {/* RESUMEN DE ORDEN */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-[#090d16] border border-neutral-800 rounded-2xl p-5 space-y-4 text-xs">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Resumen de Orden
              </span>

              <div className="space-y-2 pb-3 border-b border-neutral-800">
                <div className="flex justify-between">
                  <span className="text-white font-bold">1x General T1</span>
                  <span>$15.000</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>Service Charge (10%)</span>
                  <span>$1.500</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-white">
                <span>Total a Pagar:</span>
                <span className="text-base text-emerald-400">$16.500</span>
              </div>

              <button
                type="button"
                onClick={handleFinishPurchase}
                disabled={processing}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase rounded-xl transition-all shadow-lg shadow-blue-600/30 text-xs disabled:opacity-50"
              >
                {processing ? 'Emitiendo Entradas...' : 'Confirmar y Pagar →'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800/60 py-6 text-center text-[10px] text-neutral-500 font-mono">
        © 2026 OASIS Platform · Transacción Encriptada SSL
      </footer>
    </div>
  );
}
