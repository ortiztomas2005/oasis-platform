'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function DoorScannerPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scannedHistory, setScannedHistory] = useState<any[]>([]);
  
  // Estado de la cámara
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const lastScannedCodeRef = useRef<string>('');
  const scanLockRef = useRef<boolean>(false);

  useEffect(() => {
    fetchEvents();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events-data');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const playFeedbackSound = (type: 'SUCCESS' | 'ERROR') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'SUCCESS') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Ignorar restricciones de audio del navegador
    }
  };

  const handleValidateCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim() || scanLockRef.current) return;
    scanLockRef.current = true;
    setIsVerifying(true);

    try {
      const res = await fetch('/api/scan/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToVerify.trim(),
          eventId: selectedEventId,
        }),
      });

      const data = await res.json();
      setScanResult(data);

      if (data.valid) {
        playFeedbackSound('SUCCESS');
        setScannedHistory((prev) => [
          {
            id: data.ticket?.id || Date.now(),
            name: data.ticket?.customer_name || data.ticket?.holder_name || 'Asistente',
            dni: data.ticket?.customer_dni || data.ticket?.holder_dni || '-',
            tier: data.ticket?.tier_name || 'GENERAL',
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'APPROVED',
          },
          ...prev,
        ]);
      } else {
        playFeedbackSound('ERROR');
      }

      setManualCode('');
    } catch (err: any) {
      playFeedbackSound('ERROR');
      setScanResult({
        valid: false,
        status: 'ERROR',
        message: err.message || 'Error de conexión con el servidor',
      });
    } finally {
      setIsVerifying(false);
      // Pausa de 2 segundos antes de volver a leer el mismo QR por cámara
      setTimeout(() => {
        scanLockRef.current = false;
      }, 2000);
    }
  };

  // Iniciar Cámara con html5-qrcode
  const startCamera = async () => {
    try {
      setCameraError(null);
      const { Html5Qrcode } = await import('html5-qrcode');
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          if (decodedText && decodedText !== lastScannedCodeRef.current && !scanLockRef.current) {
            lastScannedCodeRef.current = decodedText;
            handleValidateCode(decodedText);
          }
        },
        (error: any) => {
          // Ignorar frames sin QR
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error(err);
      setCameraError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
      setIsCameraActive(false);
    }
  };

  // Detener Cámara
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCameraActive(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans p-4 sm:p-6 select-none selection:bg-yellow-400 selection:text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-400 font-black block">
                Control de Acceso • Puerta Principal
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                OASIS ACCESS CONTROL
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 font-mono text-xs text-neutral-300 rounded-xl uppercase font-bold transition-all"
            >
              ← Volver al Admin
            </Link>
          </div>
        </div>

        {/* SELECTOR DE EVENTO */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 font-mono text-xs">
          <span className="text-neutral-400 uppercase font-bold text-[10px]">Fiesta a Escanear:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-yellow-400 uppercase"
          >
            <option value="ALL">🌐 TODOS LOS EVENTOS</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name || evt.title || evt.slug}
              </option>
            ))}
          </select>
        </div>

        {/* RESULTADO VISUAL DEL ESCANEO */}
        {scanResult && (
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 transition-all font-mono space-y-3 shadow-2xl ${
              scanResult.valid
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : scanResult.status === 'RESOLD_BURNED'
                ? 'bg-yellow-950/40 border-yellow-500 text-yellow-300'
                : 'bg-rose-950/40 border-rose-500 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 border border-current">
                {scanResult.valid ? '✓ ACCESO AUTORIZADO' : '✕ ACCESO DENEGADO'}
              </span>
              <button onClick={() => setScanResult(null)} className="text-xs font-bold hover:underline">
                Limpiar ✕
              </button>
            </div>

            <p className="text-lg sm:text-xl font-black uppercase text-white">
              {scanResult.message}
            </p>

            {scanResult.ticket && (
              <div className="bg-black/60 border border-neutral-800 p-4 rounded-2xl text-xs space-y-1.5 text-neutral-200">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Titular:</span>
                  <span className="font-bold text-white uppercase text-sm">{scanResult.ticket.customer_name || scanResult.ticket.holder_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">DNI:</span>
                  <span className="font-bold text-yellow-400 text-sm">{scanResult.ticket.customer_dni || scanResult.ticket.holder_dni || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tanda:</span>
                  <span className="font-black text-white uppercase">{scanResult.ticket.tier_name || 'GENERAL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Código Hash:</span>
                  <span className="text-neutral-400 font-bold">{scanResult.ticket.auth_code || scanResult.ticket.qr_hash}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISOR DE CÁMARA Y CONTROL EN VIVO */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 font-mono space-y-4 shadow-2xl">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-yellow-400">Escáner de Cámara en Vivo</span>
            {!isCameraActive ? (
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5"
              >
                <span>📷</span>
                <span>Activar Cámara</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs rounded-xl transition-all"
              >
                ⏹ Apagar Cámara
              </button>
            )}
          </div>

          {cameraError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
              {cameraError}
            </div>
          )}

          {/* CONTENEDOR DEL VIDEO */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-neutral-800 min-h-[260px] flex items-center justify-center">
            <div id="qr-reader-container" className="w-full max-w-md"></div>
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500 text-xs p-6 text-center">
                <span className="text-3xl">📷</span>
                <p>Cámara inactiva. Hacé clic en <strong>"Activar Cámara"</strong> para escanear en tiempo real.</p>
              </div>
            )}
          </div>
        </div>

        {/* INPUT MANUAL / PISTOLA LECTORA USB & BLUETOOTH */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 space-y-4 font-mono shadow-2xl">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Escaneo Manual o Lector Láser USB</span>
            <span className="text-[10px] text-neutral-500">DNI / Hash</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidateCode(manualCode);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Escribí DNI, Hash o usá la pistola láser..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-2xl px-4 py-3.5 text-sm text-white font-bold outline-none focus:border-yellow-400 uppercase"
            />
            <button
              type="submit"
              disabled={isVerifying || !manualCode.trim()}
              className="px-6 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-2xl transition-all disabled:opacity-50 text-xs tracking-wider"
            >
              {isVerifying ? '...' : 'Validar'}
            </button>
          </form>
        </div>

        {/* HISTORIAL DE INGRESOS */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <h3 className="font-bold uppercase text-yellow-400">Ingresos Validados en esta Puerta ({scannedHistory.length})</h3>
            <span className="text-[10px] text-neutral-500">Sincronización en tiempo real</span>
          </div>

          {scannedHistory.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">Aún no se registraron ingresos en esta sesión.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scannedHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 border border-neutral-800 p-3 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-white uppercase">{item.name}</span>
                    <span className="text-neutral-500 text-[10px] ml-2">DNI: {item.dni}</span>
                    <span className="text-yellow-400 text-[10px] font-bold ml-2">[{item.tier}]</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px]">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}