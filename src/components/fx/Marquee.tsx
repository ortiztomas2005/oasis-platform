'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/core/gsap';

interface MarqueeProps {
  items: string[];
  className?: string;
  speed?: number;
}

// Cinta de texto en loop infinito — el recurso clásico de sitios
// "maximalistas" para dar sensación de movimiento constante sin competir
// por atención con el contenido real. Contenido duplicado para que el loop
// sea perfecto (cuando la primera copia sale, la segunda ya está en su
// lugar) y la animación corre sobre xPercent (GPU) a velocidad constante.
export default function Marquee({ items, className = '', speed = 40 }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!trackRef.current || items.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tween = gsap.to(trackRef.current, {
          xPercent: -50,
          ease: 'none',
          duration: speed,
          repeat: -1,
        });
        return () => {
          tween.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: trackRef, dependencies: [items.join('|'), speed] }
  );

  if (items.length === 0) return null;
  const content = [...items, ...items];

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div ref={trackRef} className="flex w-max">
        {content.map((item, i) => (
          <span key={i} className="flex items-center gap-4 px-6 whitespace-nowrap">
            <span>{item}</span>
            <span className="text-blue-500">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
