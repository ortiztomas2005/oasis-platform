'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ScanPage() {
  const [authCode, setAuthCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Iniciar Cámara Web / Celular
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
      setCameraActive(false);
    }
  };

  // Detener Cámara al salir
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleValidate = async (codeToValidate?: string) => {
    const code = codeToValidate || authCode.trim();
    if (!code) return;

    try {
      setScanning(true);
      setResult(null);
      const res = await fetch('/api/scan/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode: code }),
      });

      const data = await res.json();
      setResult(data);
      if (data.valid) {
        setAuthCode('');
      }
    } catch (err: any) {
      setResult({ valid: false, message: err.message || 'Error de conexión' });
    } finally {
      setScanning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#06080e] text-white font-mono antialiased">
      {/* NAVBAR */}
      <header className="border-b border-neutral-800/80 bg-[#090d16]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-oasis.png" alt="OASIS" className="h-8 w-auto invert brightness-200" />
            <span className="text-xs text-blue-400 font-bold uppercase tracking-widest border-l border-neutral-800 pl-3">
              Control de Acceso Puerta
            </span>
          </Link>
          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 text-xs hover:text-white"
          >
            ← Volver a Backstage
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        
        {/* VISOR DE CÁMARA */}
        <div className="bg-[#0b101c] border border-neutral-800 rounded-3xl p-5 space-y-4 text-center">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <span className="text-xs font-bold text-neutral-300 uppercase">Lector Óptico QR</span>
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all ${
                cameraActive
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
              }`}
            >
              {cameraActive ? 'Apagar Cámara' : '📷 Activar Cámara'}
            </button>
          </div>

          <div className="relative aspect-square w-full bg-black rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {!cameraActive && (
              <div className="text-center space-y-2 p-6">
                <span className="text-3xl block">📷</span>
                <p className="text-xs text-neutral-500">Cámara desactivada.</p>
                <p className="text-[10px] text-neutral-600">Presioná "Activar Cámara" para escanear con la lente de tu dispositivo.</p>
              </div>
            )}

            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-500/50 m-8 rounded-2xl flex items-center justify-center">
                <span className="text-[10px] text-blue-400 font-bold uppercase bg-black/60 px-2 py-1 rounded-md">
                  Apuntá al código QR
                </span>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="text-xs text-rose-400 font-bold">{cameraError}</p>
          )}
        </div>

        {/* INGRESO MANUAL / PISTOLA LECTORA */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleValidate();
          }}
          className="bg-[#0b101c] border border-neutral-800 rounded-3xl p-5 space-y-3"
        >
          <label className="text-[10px] uppercase font-bold text-neutral-400 block">
            Ingreso Manual de Código Hash
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Pegar o escribir Hash..."
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 uppercase font-bold"
            />
            <button
              type="submit"
              disabled={scanning || !authCode.trim()}
              className="px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50"
            >
              {scanning ? '...' : 'Validar'}
            </button>
          </div>
        </form>

        {/* FEEDBACK DE VALIDACIÓN */}
        {result && (
          <div
            className={`p-6 rounded-3xl border text-center space-y-2 ${
              result.valid
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-400'
            }`}
          >
            <span className="text-4xl block">{result.valid ? '✓' : '✕'}</span>
            <h3 className="text-lg font-black uppercase">
              {result.valid ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
            </h3>
            <p className="text-xs text-neutral-300">
              {result.message || (result.valid ? 'Entrada consumida correctamente.' : 'Ticket inválido o ya utilizado.')}
            </p>
            {result.ticket && (
              <div className="pt-3 border-t border-white/10 text-xs text-left space-y-1">
                <p>Titular: <span className="font-bold text-white uppercase">{result.ticket.customer_name}</span></p>
                <p>DNI: <span className="font-bold text-blue-400">{result.ticket.customer_dni || '-'}</span></p>
                <p>Tanda: <span className="font-bold text-white uppercase">{result.ticket.tier_name || 'General'}</span></p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}