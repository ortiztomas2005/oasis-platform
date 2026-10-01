'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/core/gsap';

// Un halo azul suave que sigue al mouse por todo el sitio — el detalle de
// "esto es un producto cuidado" que más se nota sin que nadie sepa
// explicar por qué. Solo en desktop con mouse real (hover: hover): en
// touch no hay cursor que seguir. gsap.quickTo en vez de gsap.to en cada
// mousemove — quickTo reutiliza el mismo tween internamente, así no crea
// uno nuevo en cada uno de los centenares de eventos por segundo.
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const xTo = gsap.quickTo(ref.current, 'x', { duration: 0.8, ease: 'power3.out' });
    const yTo = gsap.quickTo(ref.current, 'y', { duration: 0.8, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    gsap.set(ref.current, { xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.to(ref.current, { opacity: 1, duration: 1, delay: 0.3 });

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, {});

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[1] w-[420px] h-[420px] rounded-full opacity-0"
      style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 45%, transparent 70%)',
      }}
    />
  );
}
