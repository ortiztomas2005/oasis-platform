'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import QrCameraScanner from '@/components/QrCameraScanner';
import { useSession } from '@/core/auth/useSession';
import AuroraBackground from '@/components/fx/AuroraBackground';

interface EventOption {
  id: string;
  name?: string;
  title?: string;
}

interface ScanResult {
  valid: boolean;
  status: string;
  message: string;
  ticket?: {
    holder_name?: string;
    customer_name?: string;
    holder_dni?: string;
    customer_dni?: string;
    tier_name?: string;
  };
}

// Antes esta ruta mostraba una cartelera de eventos duplicada y hardcodeada
// (ni siquiera era un escáner) y no llamaba nunca a /api/scan/validate,
// que sí está protegido de verdad. Esta es la pantalla real para el staff
// de puerta.
export default function ScannerPage() {
  const { user, isAuthenticated, loading: sessionLoading } = useSession();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [useCamera, setUseCamera] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingEvents(false);
      return;
    }
    fetch('/api/producers/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setEventsError(data.error);
          return;
        }
        setEvents(data.events || []);
        if (data.events?.length === 1) setEventId(data.events[0].id);
      })
      .catch((e) => setEventsError(e.message))
      .finally(() => setLoadingEvents(false));
  }, [isAuthenticated]);

  const runValidation = useCallback(
    async (code: string) => {
      if (!eventId) {
        alert('Elegí primero para qué evento estás escaneando.');
        return;
      }
      setChecking(true);
      try {
        const res = await fetch('/api/scan/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, eventId }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setResult({ valid: false, status: 'ERROR', message: e.message });
      } finally {
        setChecking(false);
      }
    },
    [eventId]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    runValidation(manualCode.trim());
    setManualCode('');
  };

  if (sessionLoading || loadingEvents) {
    return <div className="min-h-screen bg-[#05070d] flex items-center justify-center text-xs text-neutral-500 font-mono">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col items-center justify-center gap-4 font-mono text-xs">
        <p>Iniciá sesión con una cuenta de staff para escanear.</p>
        <Link href="/auth?redirect=/scanner" className="px-5 py-2.5 bg-blue-600 rounded-xl text-white font-bold">
          Iniciar Sesión →
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070d] text-white font-mono overflow-x-hidden">
      <AuroraBackground />
      <header className="glass relative z-10 px-6 py-4 sticky top-0">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">Puerta · Control de Acceso</span>
            <h1 className="text-lg font-black uppercase text-white">Escáner Live Experience</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto p-6 space-y-6">
        {eventsError ? (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            ⚠️ {eventsError}
          </div>
        ) : events.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
            No sos staff de ninguna productora con eventos cargados.
          </div>
        ) : (
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Evento a escanear</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-3 bg-[#0c0f16] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Seleccioná un evento...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name || ev.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {eventId && (
          <>
            {result && (
              <div
                className={`p-5 rounded-3xl border-2 text-center space-y-2 ${
                  result.valid
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500 text-rose-300'
                }`}
              >
                <span className="text-3xl block">{result.valid ? '✅' : '⛔'}</span>
                <p className="text-sm font-black uppercase">{result.message}</p>
                {result.ticket && (
                  <div className="text-xs text-white/80 pt-2 border-t border-white/10 space-y-0.5">
                    <p className="font-bold">{result.ticket.holder_name || result.ticket.customer_name}</p>
                    <p>DNI {result.ticket.holder_dni || result.ticket.customer_dni}</p>
                    <p>{result.ticket.tier_name}</p>
                  </div>
                )}
                <button
                  onClick={() => setResult(null)}
                  className="mt-2 text-[10px] uppercase text-white/60 hover:text-white underline cursor-pointer"
                >
                  Escanear otra →
                </button>
              </div>
            )}

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setUseCamera(true)}
                className={`flex-1 py-2 rounded-xl border font-bold uppercase transition-colors duration-150 ease-out-strong active:scale-95 cursor-pointer ${useCamera ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0c0f16] border-white/10 text-neutral-400'}`}
              >
                📷 Cámara
              </button>
              <button
                onClick={() => setUseCamera(false)}
                className={`flex-1 py-2 rounded-xl border font-bold uppercase transition-colors duration-150 ease-out-strong active:scale-95 cursor-pointer ${!useCamera ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0c0f16] border-white/10 text-neutral-400'}`}
              >
                ⌨️ Manual
              </button>
            </div>

            {useCamera ? (
              <QrCameraScanner active={useCamera && !checking} onScan={runValidation} />
            ) : (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Código o DNI"
                  className="flex-1 px-4 py-3 bg-[#0c0f16] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={checking}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {checking ? '...' : 'Validar'}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
