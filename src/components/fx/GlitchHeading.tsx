import type { ElementType } from 'react';

interface GlitchHeadingProps {
  children: string;
  as?: ElementType;
  className?: string;
}

// Titular con glitch RGB-split al entrar en pantalla: la animación CSS
// (ver .glitch-rgb en globals.css) no es "infinite", así que corre una
// sola vez apenas el navegador pinta el elemento — nada de JS necesario
// para el timing. Reservado para 1-2 titulares hero por página, nunca
// para texto que se lee seguido (sería ilegible y agotador).
export default function GlitchHeading({ children, as: Tag = 'span', className = '' }: GlitchHeadingProps) {
  return (
    <Tag data-text={children} className={`glitch-rgb is-glitching ${className}`}>
      {children}
    </Tag>
  );
}
