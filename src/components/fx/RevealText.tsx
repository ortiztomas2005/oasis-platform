'use client';

import { useRef, type ElementType } from 'react';
import { gsap, useGSAP, SplitText } from '@/core/gsap';

interface RevealTextProps {
  children: string;
  as?: ElementType;
  className?: string;
  type?: 'words' | 'chars';
  delay?: number;
  scrollTrigger?: boolean;
}

// Revela texto palabra por palabra (o letra por letra) con un slide-up
// enmascarado — el detalle de "estudio de diseño" que separa un título
// plano de uno maximalista. mask: true en SplitText hace que cada palabra
// quede envuelta en un contenedor con overflow:clip, así el slide no se ve
// "cortado" sino como si la palabra emergiera desde abajo.
export default function RevealText({
  children,
  as: Tag = 'span',
  className = '',
  type = 'words',
  delay = 0,
  scrollTrigger = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current || !children) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create(ref.current, { type, mask: type });
        const targets = type === 'chars' ? split.chars : split.words;

        gsap.from(targets, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          ease: 'power4.out',
          stagger: type === 'chars' ? 0.018 : 0.06,
          delay,
          scrollTrigger: scrollTrigger ? { trigger: ref.current, start: 'top 85%' } : undefined,
        });

        return () => split.revert();
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [children, type], revertOnUpdate: true }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
