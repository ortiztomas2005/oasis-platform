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
  const [oauthAvailable, setOauthAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      setOauthAvailable(!!data.oauthAvailable);
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

  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/producers/mercadopago/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, publicKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al conectar');
      setAccessToken('');
      setPublicKey('');
      await load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
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

              {connected && (
                <p className="text-[11px] text-neutral-500 leading-relaxed bg-black/30 border border-white/5 rounded-xl p-3">
                  💡 Cuándo se libera el dinero (al instante con comisión extra, o gratis en ~14 días) no lo maneja
                  Live Experience — lo elegís vos dentro de tu propia cuenta de Mercado Pago, en{' '}
                  <a
                    href="https://www.mercadopago.com.ar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#009ee3] underline"
                  >
                    mercadopago.com.ar
                  </a>{' '}
                  → Tu negocio → Configuración → Dinero.
                </p>
              )}

              {connected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-5 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 text-xs font-bold hover:bg-rose-950/50 transition disabled:opacity-50 cursor-pointer"
                >
                  {disconnecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              ) : (
                <>
                  {oauthAvailable && (
                    <a
                      href="/api/producers/mercadopago/connect"
                      className="inline-block px-5 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-white text-xs font-black uppercase transition"
                    >
                      Conectar con Mercado Pago →
                    </a>
                  )}

                  <form onSubmit={handleConnectManual} className="space-y-4 pt-3 border-t border-white/5 mt-2">
                    <div>
                      <h2 className="text-xs font-bold uppercase text-neutral-300 mb-2">
                        {oauthAvailable ? 'O pegá tus credenciales a mano' : 'Conectá pegando tus credenciales'}
                      </h2>
                      <p className="text-[11px] text-amber-300/90 bg-amber-950/20 border border-amber-800/40 rounded-lg px-2.5 py-2 mb-2">
                        📱→💻 Esto no está en la app del celular. Abrí un navegador (Chrome/Safari) e
                        hacelo desde ahí, no desde la app de Mercado Pago.
                      </p>
                      <ol className="space-y-2">
                        {[
                          <>
                            En el navegador, entrá a{' '}
                            <a
                              href="https://www.mercadopago.com.ar"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#009ee3] underline"
                            >
                              mercadopago.com.ar
                            </a>{' '}
                            y logueate con tu cuenta (la tuya, no hace falta crear nada nuevo).
                          </>,
                          <>
                            Buscá <strong className="text-neutral-300">"Tu negocio"</strong> →{' '}
                            <strong className="text-neutral-300">Integraciones</strong>.
                          </>,
                          <>
                            Si te dice "No hay aplicaciones creadas", tocá{' '}
                            <strong className="text-neutral-300">"Crear aplicación"</strong> — ponele
                            cualquier nombre (ej: tu productora), elegí{' '}
                            <strong className="text-neutral-300">"Pagos online"</strong> y después{' '}
                            <strong className="text-neutral-300">"Checkout Pro"</strong>. Esto no es nada
                            de developer de verdad, es solo un paso que pide Mercado Pago para mostrarte
                            las credenciales.
                          </>,
                          <>
                            Ahora sí vas a ver pestañas de credenciales. Asegurate de estar parado en{' '}
                            <strong className="text-emerald-400">"Credenciales de producción"</strong> (no
                            "de prueba").
                          </>,
                          <>
                            Copiá el <strong className="text-neutral-300">Access Token</strong> y la{' '}
                            <strong className="text-neutral-300">Public Key</strong> y pegalos abajo.
                          </>,
                        ].map((step, i) => (
                          <li key={i} className="flex gap-2.5 text-[11px] text-neutral-400 leading-relaxed">
                            <span className="shrink-0 w-4 h-4 rounded-full bg-[#009ee3]/20 text-[#009ee3] text-[10px] font-black flex items-center justify-center mt-0.5">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[11px] leading-relaxed">
                      ⚠️ Si lo que copiaste empieza con <strong>"TEST-"</strong> es de prueba y no sirve para
                      cobrar de verdad — tiene que empezar con <strong>"APP_USR-"</strong>.
                    </div>

                    {formError && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                        ⚠️ {formError}
                      </div>
                    )}

                    <div className="space-y-1">
                      <input
                        required
                        type="password"
                        placeholder="Access Token (APP_USR-...)"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        className={`w-full px-3.5 py-2.5 bg-black/60 border rounded-xl text-xs text-white outline-none ${
                          accessToken.trim().startsWith('TEST-')
                            ? 'border-rose-700 focus:border-rose-500'
                            : 'border-white/10 focus:border-[#009ee3]'
                        }`}
                      />
                      {accessToken.trim().startsWith('TEST-') && (
                        <p className="text-[10px] text-rose-400">
                          Ese es el Access Token de prueba — buscá el de producción.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <input
                        required
                        placeholder="Public Key (APP_USR-...)"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        className={`w-full px-3.5 py-2.5 bg-black/60 border rounded-xl text-xs text-white outline-none ${
                          publicKey.trim().startsWith('TEST-')
                            ? 'border-rose-700 focus:border-rose-500'
                            : 'border-white/10 focus:border-[#009ee3]'
                        }`}
                      />
                      {publicKey.trim().startsWith('TEST-') && (
                        <p className="text-[10px] text-rose-400">
                          Esa es la Public Key de prueba — buscá la de producción.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={
                        submitting || accessToken.trim().startsWith('TEST-') || publicKey.trim().startsWith('TEST-')
                      }
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase transition active:scale-95"
                    >
                      {submitting ? 'Conectando...' : 'Conectar'}
                    </button>
                  </form>
                </>
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
