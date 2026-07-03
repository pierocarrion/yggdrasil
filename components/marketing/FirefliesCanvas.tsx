'use client';

import { useEffect, useRef } from 'react';
import { rng, setupCanvas, prefersReducedMotion } from './canvas';

/**
 * Closing CTA background: 18 gold motes drifting slowly upward, each with a
 * soft halo. Ported from the design prototype's initCta().
 */
export function FirefliesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const env = setupCanvas(canvasRef);
    if (!env) return;
    const { ctx, W, H } = env;
    const reduced = prefersReducedMotion();
    if (reduced) {
      ctx.clearRect(0, 0, W, H);
      return;
    }
    const rnd = rng(77);
    const flies = Array.from({ length: 18 }, () => ({
      x: rnd() * W,
      y: rnd() * H,
      v: 4 + rnd() * 9,
      ph: rnd() * 6.28,
      r: 1 + rnd() * 1.6,
    }));
    const t0 = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const f of flies) {
        const yy = ((((f.y - t * f.v) % (H + 30)) + H + 30) % (H + 30)) - 15;
        const xx = f.x + Math.sin(t * 0.4 + f.ph) * 22;
        const a = 0.12 + 0.1 * Math.sin(t * 1.1 + f.ph);
        ctx.fillStyle = `rgba(201,168,76,${Math.max(0.03, a)})`;
        ctx.beginPath();
        ctx.arc(xx, yy, f.r, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = `rgba(201,168,76,${Math.max(0.01, a * 0.25)})`;
        ctx.beginPath();
        ctx.arc(xx, yy, f.r * 3.5, 0, 6.29);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
