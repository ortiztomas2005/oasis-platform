'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/core/gsap';

interface MagneticProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}

// Efecto "imán": el elemento se desplaza un poco hacia el cursor al
// acercarse, y vuelve a su lugar con un rebote elástico al soltarlo. Solo
// en dispositivos con mouse real (hover: hover) — en touch no tiene
// sentido y tocarlo dispararía el :active en vez de esto.
export default function Magnetic({ children, className = '', strength = 0.35, onClick }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el || !contextSafe) return;
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const onMove = contextSafe((e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.6, ease: 'power3.out' });
      });

      const onLeave = contextSafe(() => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      return () => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      };
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={`inline-block ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
