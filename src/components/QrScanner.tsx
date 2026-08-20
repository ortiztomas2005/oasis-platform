'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export function QrScanner({ onScanSuccess }: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      () => {
        // Ignoramos frames vacíos
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch((err) => console.error('Error clearing scanner', err));
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-2 shadow-2xl">
      <div id="qr-reader" className="w-full text-white" />
    </div>
  );
}