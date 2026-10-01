'use client';

// Punto único de registro de GSAP para todo el sitio. Se importa SIEMPRE
// desde acá (nunca "gsap" directo en un componente) para que los plugins
// se registren una sola vez, sin importar cuántos componentes los usen.
// registerPlugin() no toca el DOM, así que es seguro ejecutarlo en el
// cuerpo del módulo incluso bajo SSR — pero el `typeof window` evita que
// corra dos veces en Fast Refresh y deja explícito que esto es client-only.
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin);

  // Curva propia para el estilo "maximalista" del sitio: más carácter que
  // las eases nativas de GSAP, pero sin exagerar el rebote.
  gsap.registerEase('oasisPunch', (p: number) => {
    const c = 1.5;
    return 1 + c * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
  });

  gsap.defaults({ ease: 'power3.out', duration: 0.8 });
}

export { gsap, useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin };
