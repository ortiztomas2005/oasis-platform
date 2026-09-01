'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  deliveredAt?: string;
}

export default function BarCounterValidationPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<BarOrder[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; msg: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Cargar pedidos en cola
  useEffect(() => {
    try {
      const stored = localStorage.getItem('oasis_bar_orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        const initial: BarOrder[] = [
          {
            id: 'ord-101',
            token: 'BR-8821',
            eventName: 'OASIS Sunset Edition',
            items: [
              { name: 'Gin Tonic Heredero', quantity: 2, price: 6500 },
              { name: 'Agua Mineral', quantity: 1, price: 2500 },
            ],
            total: 15500,
            customerName: 'Santiago Rossi',
            customerDni: '42.190.231',
            status: 'pending',
            createdAt: '22:15 HS',
          },
          {
            id: 'ord-102',
            token: 'BR-9043',
            eventName: 'OASIS Sunset Edition',
            items: [{ name: 'Fernet Branca XL', quantity: 1, price: 7000 }],
            total: 7000,
            customerName: 'Lucía Benítez',
            customerDni: '40.871.902',
            status: 'delivered',
            createdAt: '21:50 HS',
            deliveredAt: '22:04 HS',
          },
        ];
        setOrders(initial);
        localStorage.setItem('oasis_bar_orders', JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('Error leyendo pedidos');
    }
  }, []);

  // 2. Control nativo de cámara (WebRTC)
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      // Intenta cámara trasera primero (ideal para teléfonos en la barra)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Intentando con cámara por defecto...');
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallback;
        if (videoRef.current) {
          videoRef.current.srcObject = fallback;
          await videoRef.current.play();
        }
      } catch (finalErr) {
        console.error('Error encendiendo cámara:', finalErr);
        setCameraError('No se pudo acceder al lente. Verificá los permisos del navegador en el candado 🔒 de la URL.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 3. Validación y despacho de pedidos
  const handleValidate = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    const current: BarOrder[] = JSON.parse(localStorage.getItem('oasis_bar_orders') || '[]');
    const idx = current.findIndex(
      (o) => o.token.toUpperCase() === clean || o.id.toUpperCase() === clean
    );

    if (idx === -1) {
      setFeedback({
        type: 'error',
        msg: `El código "${clean}" no existe en el sistema de consumiciones.`,
      });
      return;
    }

    const order = current[idx];

    if (order.status === 'delivered') {
      setFeedback({
        type: 'warning',
        msg: `El pedido ${order.token} ya fue entregado a las ${order.deliveredAt} a ${order.customerName}.`,
      });
      return;
    }

    const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' HS';
    current[idx] = {
      ...order,
      status: 'delivered',
      deliveredAt: now,
    };

    setOrders(current);
    localStorage.setItem('oasis_bar_orders', JSON.stringify(current));
    setFeedback({
      type: 'success',
      msg: `¡Pedido ${order.token} despachado exitosamente a ${order.customerName}!`,
    });
    setManualCode('');
  };

  const pending = orders.filter((o) => o.status === 'pending');
  const delivered = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* HEADER: SIEMPRE REGRESA A /admin */}
      <header className="border-b border-slate-800/80 bg-[#0f131c]/95 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl border border-slate-800 bg-[#161a26] hover:bg-[#1d2333] hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition flex items-center gap-2"
          >
            <span>←</span>
            <span>Volver a Productora</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Puesto de Barra & Despacho</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => (isCameraActive ? stopCamera() : startCamera())}
            className={`px-4 py-2 rounded-xl font-bold uppercase transition flex items-center gap-2 shadow-lg ${
              isCameraActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30 font-black'
            }`}
          >
            <span>📷</span>
            <span>{isCameraActive ? 'Apagar Cámara' : 'Escanear QR Barra'}</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8 flex-1">
        {/* TITULAR Y MÉTRICAS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              <span>●</span> Fast Despatch Counter
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Validador de Barra
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Entregá tragos escaneando el código QR o ingresando el identificador del ticket.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-5 py-3 rounded-2xl bg-[#131722] border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Por Entregar</span>
              <span className="text-2xl font-black text-white">{pending.length}</span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#131722] border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Entregados</span>
              <span className="text-2xl font-black text-white">{delivered.length}</span>
            </div>
          </div>
        </div>

        {/* FEEDBACK TRAS VALIDACIÓN */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border font-mono text-xs flex items-center justify-between transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            <span>{feedback.msg}</span>
            <button onClick={() => setFeedback(null)} className="text-xs hover:opacity-70 font-bold pl-3">
              ✕
            </button>
          </div>
        )}

        {/* VISOR DE CÁMARA */}
        {isCameraActive && (
          <section className="bg-[#131722] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
              <span className="text-xs font-bold text-amber-400 uppercase">
                Visor de Escaneo en Vivo
              </span>
              <button onClick={stopCamera} className="text-xs text-slate-400 hover:text-white">
                ✕ Cerrar
              </button>
            </div>

            <div className="relative aspect-square w-full bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {cameraError ? (
                <div className="p-4 text-center font-mono space-y-2">
                  <span className="text-2xl block">⚠️</span>
                  <p className="text-xs text-rose-400">{cameraError}</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-amber-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300" />
                      <div className="w-full h-0.5 bg-amber-400/90 animate-pulse mt-28 shadow-[0_0_8px_#fbbf24]" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* INPUT MANUAL DE TOKEN */}
        <div className="bg-[#131722] border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between font-mono">
          <span className="text-xs text-slate-400 font-bold uppercase">
            Ingreso Rápido de Código:
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ej: BR-8821"
              className="bg-[#181d2a] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white uppercase outline-none focus:border-amber-500 w-full sm:w-60"
            />
            <button
              onClick={() => handleValidate(manualCode)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition shadow-md"
            >
              Validar
            </button>
          </div>
        </div>

        {/* GRILLA DE PEDIDOS EN COLA */}
        <section className="space-y-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400 uppercase font-bold tracking-wider">
              En Espera de Retiro ({pending.length})
            </span>
          </div>

          {pending.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#131722]/40 font-mono space-y-2">
              <span className="text-2xl block">🍸</span>
              <p className="text-xs text-slate-400">No hay órdenes pendientes en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pending.map((o) => (
                <div
                  key={o.id}
                  className="bg-[#131722] border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Código</span>
                        <span className="text-xl font-black text-amber-400 tracking-wider">
                          {o.token}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-black/50 px-2.5 py-1 rounded-lg border border-white/5">
                        {o.createdAt}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-white text-sm">{o.customerName}</p>
                      <p className="text-xs text-slate-400">DNI: {o.customerDni}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-slate-400">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleValidate(o.token)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black uppercase rounded-xl transition shadow-md shadow-emerald-600/20"
                  >
                    Marcar como Entregado ✓
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HISTORIAL RECIENTE */}
        {delivered.length > 0 && (
          <section className="space-y-3 pt-6 border-t border-slate-800/80 font-mono">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">
              Últimas Entregas Despachadas
            </span>
            <div className="space-y-2">
              {delivered.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="bg-[#131722]/60 border border-slate-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {o.token}
                    </span>
                    <span className="text-white font-semibold">{o.customerName}</span>
                    <span className="text-slate-500 text-[11px]">
                      ({o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')})
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Entregado a las {o.deliveredAt}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0c0f16] py-5 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span>OASIS LIVE · Sistema de Despacho Inmediato</span>
          <span className="text-[11px] text-slate-400">Terminal de Barra Conectada</span>
        </div>
      </footer>
    </div>
  );
}