'use client';

import React, { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

export default function QrScanner({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Escanear Código QR',
  subtitle = 'Apunte la cámara hacia el código QR o ingrese el código',
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setErrorMsg(null);
        // Solicita cámara (trasera si es cel, default si es notebook)
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        console.warn('Fallo cámara trasera, intentando cualquier cámara disponible...', err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          currentStream = fallbackStream;
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
        } catch (finalErr: any) {
          console.error('Error total cámara:', finalErr);
          setErrorMsg(
            'No se pudo encender la cámara. Verificá que no esté bloqueada en el candadito 🔒 de la URL o utilizá el validador manual.'
          );
        }
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#121622] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Lector Activo
            </span>
            <h3 className="text-base font-black uppercase text-white tracking-wide">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-mono text-sm transition"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 font-mono">{subtitle}</p>

        {/* Visor nativo de cámara */}
        <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {errorMsg ? (
            <div className="p-5 text-center space-y-2 font-mono">
              <span className="text-3xl block">⚠️</span>
              <p className="text-xs text-rose-400 leading-relaxed">{errorMsg}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Marco visor láser animado */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-blue-500/60 rounded-2xl relative shadow-[0_0_25px_rgba(37,99,235,0.3)]">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                  <div className="w-full h-0.5 bg-blue-400/80 shadow-[0_0_8px_#60a5fa] animate-pulse mt-28" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Input rápido por si el cliente dicta el token o la cámara tiene reflejo */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 font-mono">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Validación de Token / Código:
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ej: OASIS-BR-9281"
              className="flex-1 bg-[#181d2a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition"
            >
              Validar
            </button>
          </div>
        </form>

        <button
          onClick={handleClose}
          className="w-full py-2 rounded-xl border border-slate-800 bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white font-mono text-xs transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}