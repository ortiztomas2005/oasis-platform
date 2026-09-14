'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cámara con decodificación real de QR (html5-qrcode ya estaba instalado
 * en el proyecto pero ningún componente lo usaba). onScan se llama una
 * vez por cada código detectado — el que la use decide qué hacer con
 * lecturas repetidas (acá se pausa el escaneo 1.5s tras cada lectura para
 * no disparar el mismo código en cada frame).
 */
export default function QrCameraScanner({
  active,
  onScan,
}: {
  active: boolean;
  onScan: (text: string) => void;
}) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`).current;
  const scannerRef = useRef<any>(null);
  const pausedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (cancelled) return;

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          (decodedText: string) => {
            if (pausedRef.current) return;
            pausedRef.current = true;
            onScan(decodedText);
            setTimeout(() => {
              pausedRef.current = false;
            }, 1500);
          },
          () => {
            // Se llama en cada frame sin código detectado — no es un error real, se ignora.
          }
        );
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudo acceder a la cámara.');
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        (scanner.isScanning ? scanner.stop() : Promise.resolve())
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear();
            } catch {}
          });
      }
    };
  }, [active, containerId, onScan]);

  if (!active) return null;

  return (
    <div className="space-y-2">
      <div id={containerId} className="w-full rounded-2xl overflow-hidden bg-black" />
      {error && (
        <p className="text-xs text-rose-400 text-center">
          ⚠️ {error} — podés seguir escaneando con el código manual.
        </p>
      )}
    </div>
  );
}
