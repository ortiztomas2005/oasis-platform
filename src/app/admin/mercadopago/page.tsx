'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const STATUS_MESSAGES: Record<string, { text: string; tone: 'ok' | 'error' }> = {
  connected: { text: '¡Mercado Pago conectado con éxito! Ya podés vender cobrando directo a tu cuenta.', tone: 'ok' },
  denied: { text: 'Cancelaste la autorización en Mercado Pago.', tone: 'error' },
  invalid: { text: 'El link de vuelta de Mercado Pago no vino completo. Probá de nuevo.', tone: 'error' },
  invalid_state: { text: 'La sesión de conexión expiró o no coincide. Probá de nuevo.', tone: 'error' },
  no_session: { text: 'Perdiste la sesión durante el proceso. Iniciá sesión y probá de nuevo.', tone: 'error' },
  error: { text: 'Mercado Pago no pudo confirmar la conexión. Probá de nuevo en un rato.', tone: 'error' },
};

function MercadoPagoConnectContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');

  const [loading, setLoading] = useState(true);
  const [producerName, setProducerName] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers/mercadopago/status');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al consultar el estado');
        setProducerName(null);
        return;
      }
      setProducerName(data.producerName);
      setConnected(data.connected);
      setConnectedAt(data.connectedAt);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar tu cuenta de Mercado Pago? Vas a dejar de poder cobrar por MP hasta que la vuelvas a conectar.')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/producers/mercadopago/status', { method: 'DELETE' });
      await load();
    } finally {
      setDisconnecting(false);
    }
  };

  const statusMsg = statusParam ? STATUS_MESSAGES[statusParam] : null;

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">
              Cobros de tu Productora
            </span>
            <h1 className="text-2xl font-black uppercase text-white">Mercado Pago</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs border ${
              statusMsg.tone === 'ok'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            {statusMsg.tone === 'ok' ? '✅' : '⚠️'} {statusMsg.text}
          </div>
        )}

        <div className="bg-[#0c0f16] border border-white/10 rounded-2xl p-6 space-y-4">
          {loading ? (
            <p className="text-xs text-neutral-500">Cargando...</p>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-xs text-amber-400">{error}</p>
              <p className="text-xs text-neutral-500">
                Necesitás una cuenta de cliente registrada como productora en{' '}
                <Link href="/auth" className="text-amber-400 underline">/auth</Link>.
              </p>
            </div>
          ) : (
            <>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Productora</span>
                <span className="text-sm font-bold text-white">{producerName}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-neutral-600'}`}
                />
                <span className="text-xs text-neutral-300">
                  {connected ? `Conectado desde ${connectedAt ? new Date(connectedAt).toLocaleDateString('es-AR') : ''}` : 'No conectado todavía'}
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {connected
                  ? 'Las ventas de tus eventos por Mercado Pago se cobran directo a esta cuenta. Live Experience no se queda con nada del pago en sí.'
                  : 'Conectá tu cuenta de Mercado Pago para poder cobrar por MP en tus eventos. Sin esto, tus compradores solo van a poder pagar por transferencia.'}
              </p>

              {connected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-5 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 text-xs font-bold hover:bg-rose-950/50 transition disabled:opacity-50 cursor-pointer"
                >
                  {disconnecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              ) : (
                <a
                  href="/api/producers/mercadopago/connect"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-white text-xs font-black uppercase transition"
                >
                  Conectar con Mercado Pago →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MercadoPagoConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05070d]" />}>
      <MercadoPagoConnectContent />
    </Suspense>
  );
}
