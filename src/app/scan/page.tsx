'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ScanPage() {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerInstanceRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  const processValidation = async (code: string) => {
    if (!code.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/scan/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawValue: code.trim() }),
      });

      const data = await res.json();
      setResponse(data);
      if (data.valid || data.success) {
        setInputCode('');
      }
    } catch {
      setResponse({ success: false, message: 'Error de red o servidor' });
    } finally {
      setLoading(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2500);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processValidation(inputCode);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const { Html5Qrcode } = await import('html5-qrcode');

      if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerInstanceRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText: string) => {
          if (!isProcessingRef.current) {
            processValidation(decodedText);
          }
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err: any) {
      setCameraError('No se pudo inicializar la cámara o no diste permisos.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerInstanceRef.current && cameraActive) {
      try {
        await scannerInstanceRef.current.stop();
        await scannerInstanceRef.current.clear();
      } catch (e) {
        console.error(e);
      } finally {
        scannerInstanceRef.current = null;
        setCameraActive(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {}).then(() => {
          scannerInstanceRef.current?.clear();
          scannerInstanceRef.current = null;
        });
      }
    };
  }, []);

  const isApproved = response?.valid === true || response?.success === true;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Control de Acceso</h1>
          <p className="text-xs text-neutral-500 font-mono">OASIS Door Management</p>
        </div>
        <Link
          href="/admin"
          onClick={stopCamera}
          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 hover:text-white"
        >
          Volver a Backstage
        </Link>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* Lector de Cámara */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col items-center">
          {/* Contenedor estático del video para evitar colisiones con el Virtual DOM de React */}
          <div
            id="qr-reader"
            className={`w-full max-w-[300px] aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 ${
              cameraActive ? 'block' : 'hidden'
            }`}
          />

          {!cameraActive && (
            <div className="text-center py-6 space-y-3">
              <div className="text-3xl">📷</div>
              <p className="text-xs text-neutral-400 font-medium">
                {cameraError || 'Cámara en espera'}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider transition-all"
              >
                Activar Cámara QR
              </button>
            </div>
          )}

          {cameraActive && (
            <button
              type="button"
              onClick={stopCamera}
              className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold"
            >
              Apagar Cámara
            </button>
          )}
        </div>

        {/* Feedback de Validación */}
        {response && (
          <div
            className={`p-5 rounded-2xl border text-center transition-all ${
              isApproved
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500 text-rose-300'
            }`}
          >
            <div className="text-3xl mb-1">{isApproved ? '✅' : '⛔'}</div>
            <h2 className="text-lg font-black uppercase tracking-wider">
              {isApproved ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
            </h2>
            <p className="text-xs font-semibold mt-1 opacity-90">{response.message}</p>

            {(response.ticket || response.attendee) && (
              <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 text-left text-xs space-y-1">
                <p className="text-white font-bold text-sm">
                  {response.ticket?.name || response.attendee?.name}
                </p>
                <p className="text-neutral-400">
                  DNI:{' '}
                  <span className="text-neutral-200 font-mono font-bold">
                    {response.ticket?.dni || response.attendee?.dni}
                  </span>
                </p>
                <p className="text-neutral-400">
                  Tanda:{' '}
                  <span className="text-amber-400 font-bold">
                    {response.ticket?.type || response.attendee?.tier}
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={() => setResponse(null)}
              className="mt-3 w-full py-1.5 rounded-lg bg-neutral-900 text-[11px] font-semibold text-neutral-300 border border-neutral-700"
            >
              Limpiar Estado
            </button>
          </div>
        )}

        {/* Validación Manual */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Ingreso manual por DNI / Código
          </label>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: 46405608"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all"
            >
              {loading ? '...' : 'Verificar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}