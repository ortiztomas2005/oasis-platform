'use client';

import { useEffect, useRef } from 'react';

// Fondo "Aurora" real: canvas 2D con varios blobs de luz que se mueven por
// trayectorias orgánicas (suma de senos con distinta frecuencia/fase por
// eje, nunca se repiten en una vuelta corta) y se funden entre sí con
// globalCompositeOperation "lighter" — así donde dos luces se cruzan, el
// color se SUMA como luz real, no como dos círculos borrosos superpuestos.
// Es la misma técnica detrás de la mayoría de los fondos "aurora/liquid"
// que se ven en sitios con mucha producción visual (tipo React Bits), acá
// hecha a medida en vanilla canvas para no sumar una librería WebGL nueva.
// Reemplaza la versión anterior (divs con blur + GSAP) con el mismo
// nombre de componente, así ninguna página que ya lo usa necesita cambios.

interface BlobConfig {
  baseX: number; // fracción del viewport (0-1)
  baseY: number;
  radius: number; // fracción del lado mayor del viewport
  color: [number, number, number];
  freqX: number;
  freqY: number;
  ampX: number;
  ampY: number;
  alpha: number;
}

// Azul/índigo/violeta dominan (la marca); un solo acento magenta chico,
// igual que en la versión anterior — nunca compite con el azul.
const BLOBS: BlobConfig[] = [
  { baseX: 0.14, baseY: 0.22, radius: 0.5, color: [59, 130, 246], freqX: 0.00011, freqY: 0.00015, ampX: 0.12, ampY: 0.1, alpha: 0.26 },
  { baseX: 0.86, baseY: 0.28, radius: 0.55, color: [99, 102, 241], freqX: 0.00009, freqY: 0.00012, ampX: 0.1, ampY: 0.13, alpha: 0.22 },
  { baseX: 0.28, baseY: 0.88, radius: 0.46, color: [139, 92, 246], freqX: 0.00013, freqY: 0.0001, ampX: 0.14, ampY: 0.09, alpha: 0.16 },
  { baseX: 0.6, baseY: 0.5, radius: 0.3, color: [34, 211, 238], freqX: 0.0001, freqY: 0.00014, ampX: 0.1, ampY: 0.1, alpha: 0.1 },
  { baseX: 0.78, baseY: 0.82, radius: 0.22, color: [236, 72, 153], freqX: 0.00016, freqY: 0.00012, ampX: 0.08, ampY: 0.08, alpha: 0.12 },
];

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phases = BLOBS.map(() => ({ px: Math.random() * 10000, py: Math.random() * 10000 }));

    let raf = 0;
    let lastFrame = 0;
    let lastPaintedT = 0;
    let alive = true;

    function paint(t: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const side = Math.max(w, h);
      ctx!.clearRect(0, 0, w, h);
      ctx!.globalCompositeOperation = 'lighter';

      BLOBS.forEach((b, i) => {
        const x = (b.baseX + Math.sin(t * b.freqX + phases[i].px) * b.ampX) * w;
        const y = (b.baseY + Math.cos(t * b.freqY + phases[i].py) * b.ampY) * h;
        const r = b.radius * side;
        const grad = ctx!.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${b.alpha})`);
        grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0)`);
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, w, h);
      });
      lastPaintedT = t;
    }

    // Cambiar canvas.width/height borra el buffer a transparente al
    // instante — en mobile, el navegador dispara "resize" seguido cada
    // vez que la barra de direcciones se esconde/aparece al scrollear.
    // Sin repintar ahí mismo, se veía el negro de fondo de la página por
    // un instante en cada uno de esos resizes (el "fondo se pone negro"
    // al scrollear). Repintar de forma SÍNCRONA, en el mismo tick que se
    // redimensiona, cierra ese hueco por completo.
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(lastPaintedT);
    }
    resize();
    window.addEventListener('resize', resize);

    function loop(t: number) {
      if (!alive) return;
      // Tope ~30fps: el movimiento es lento y orgánico, no hace falta 60fps
      // y así se gasta la mitad de GPU/batería en gama baja.
      if (t - lastFrame >= 33) {
        lastFrame = t;
        paint(t);
      }
      raf = requestAnimationFrame(loop);
    }

    if (reduceMotion) {
      paint(0); // un solo frame estático, sin animar
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}
