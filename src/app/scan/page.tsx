'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Cargamos el scanner sólo del lado del cliente (evita errores con window/cámara en SSR)
const QrScanner = dynamic(
  () => import('@/components/QrScanner').then((mod) => mod.QrScanner),
  { ssr: false }
);

interface ScanResult {
  valid: boolean;
  message: string;
  ticketType?: string;
  eventTitle?: string;
  orderNumber?: string;
  usedAt?: string;
  checkInTime?: string;
}

export default function ScanPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');

  const processScan = async (qrDataOrId: string) => {
    if (isValidating) return;
    setIsValidating(true);
    setResult(null);

    try {
      const res = await fetch('/api/scan/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          qrDataOrId.startsWith('{')
            ? { qrData: qrDataOrId }
            : { ticketId: qrDataOrId }
        ),
      });

      const data: ScanResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        valid: false,
        message: 'Error de conexión al validar',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicketId.trim()) return;
    processScan(manualTicketId.trim());
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Control de Acceso</h1>
            <p className="text-xs text-neutral-400">OASIS Door Management</p>
          </div>
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900"
          >
            Salir
          </Link>
        </div>

        {/* Cámara / Lector QR */}
        <div className="space-y-3">
          <QrScanner onScanSuccess={(text) => processScan(text)} />
          {isValidating && (
            <p className="text-center text-xs font-semibold text-amber-400 animate-pulse">
              Verificando ticket en el servidor...
            </p>
          )}
        </div>

        {/* Feedback visual del escaneo */}
        {result && (
          <div
            className={`p-6 rounded-2xl border animate-in zoom-in-95 duration-150 ${
              result.valid
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                : 'bg-red-950/40 border-red-500/60 text-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-extrabold tracking-widest">
                {result.valid ? '✓ VÁLIDO' : '✗ DENEGADO'}
              </span>
              {result.orderNumber && (
                <span className="text-xs font-mono opacity-75">#{result.orderNumber}</span>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              {result.message}
            </h2>

            {result.ticketType && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-xs">
                <p>
                  <strong>Entrada:</strong> {result.ticketType}
                </p>
                {result.eventTitle && (
                  <p>
                    <strong>Evento:</strong> {result.eventTitle}
                  </p>
                )}
                {result.usedAt && (
                  <p className="text-red-400">
                    <strong>Utilizado el:</strong> {new Date(result.usedAt).toLocaleTimeString('es-AR')}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              Listo para siguiente escaneo
            </button>
          </div>
        )}

        {/* Búsqueda Manual de Emergencia */}
        <form onSubmit={handleManualSubmit} className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/30 space-y-2">
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
            Validación Manual por ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Pegar ID del ticket..."
              className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isValidating}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold"
            >
              Verificar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}