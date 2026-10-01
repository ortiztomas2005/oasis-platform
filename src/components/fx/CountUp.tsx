'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/core/gsap';

interface CountUpProps {
  value: number;
  prefix?: string;
  className?: string;
}

// Los precios cuentan hacia arriba desde 0 la primera vez que entran en
// pantalla (once: true — no se repite en cada scroll) en vez de aparecer
// como texto estático. Con prefers-reduced-motion directamente muestra el
// valor final, sin animar.
export default function CountUp({ value, prefix = '', className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const obj = { val: 0 };

      const mm = gsap.matchMedia();
      mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, (ctx) => {
        const { reduceMotion } = ctx.conditions as { reduceMotion: boolean };
        if (reduceMotion) {
          if (ref.current) ref.current.textContent = prefix + value.toLocaleString('es-AR');
          return;
        }
        gsap.to(obj, {
          val: value,
          duration: 1.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
          onUpdate: () => {
            if (ref.current) ref.current.textContent = prefix + Math.round(obj.val).toLocaleString('es-AR');
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [value, prefix] }
  );

  return (
    <span ref={ref} className={className}>
      {prefix}0
    </span>
  );
}
