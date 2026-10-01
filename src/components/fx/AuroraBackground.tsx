'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/core/gsap';

// Fondo "Aurora": en vez de los tres halos de luz estáticos que tenía
// cada página, estos derivan lenta y orgánicamente (posición + escala +
// opacidad) en loops infinitos asincrónicos — cada blob con su propia
// duración, para que nunca se sientan sincronizados ni mecánicos. Es el
// mismo truco visual de las luces del Norte: grandes degradados que
// respiran de a poco. Pura decoración (aria-hidden, pointer-events none),
// y con prefers-reduced-motion se queda quieto en su posición inicial.
export default function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const blobs = ref.current!.querySelectorAll('.aurora-blob');
        const tweens = Array.from(blobs).map((blob, i) =>
          gsap.to(blob, {
            x: i % 2 === 0 ? 60 : -50,
            y: i % 3 === 0 ? -40 : 50,
            scale: 1.15,
            opacity: 0.8,
            duration: 10 + i * 3.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })
        );
        return () => tweens.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="aurora-blob absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-blue-600/25 blur-[130px]" />
      <div className="aurora-blob absolute top-1/4 -right-40 w-[36rem] h-[36rem] rounded-full bg-indigo-600/20 blur-[150px]" />
      <div className="aurora-blob absolute bottom-[-10rem] left-1/4 w-[28rem] h-[28rem] rounded-full bg-violet-600/10 blur-[140px]" />
      <div className="aurora-blob absolute top-1/2 left-1/2 w-[24rem] h-[24rem] rounded-full bg-cyan-500/10 blur-[130px]" />
      {/* Toque synthwave: un quinto blob magenta, chico y tenue — el único
          acento que no es azul/índigo/violeta en toda la paleta. Suficiente
          para leerse como "cyberpunk nocturno" sin competir con la marca. */}
      <div className="aurora-blob absolute bottom-10 right-10 w-[18rem] h-[18rem] rounded-full bg-pink-600/10 blur-[110px]" />
    </div>
  );
}
