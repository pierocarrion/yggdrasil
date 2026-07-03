'use client';

import { useEffect, useRef } from 'react';
import { rng, setupCanvas, prefersReducedMotion } from './canvas';

type Seg = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  depth: number;
  t0: number;
  t1: number;
  gold: boolean;
  ph: number;
  cr: number;
  cg: number;
  cb: number;
};

/**
 * Hero background: golden fractal roots drawing themselves downward (~6.5s),
 * then shimmering, with gold spores drifting upward. Ported from the design
 * prototype's initRoots().
 */
export function RootsCanvas({ goldenness = 0.75 }: { goldenness?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const env = setupCanvas(canvasRef);
    if (!env) return;
    const { ctx, W, H } = env;
    const reduced = prefersReducedMotion();
    const gg = Math.max(0, Math.min(1, goldenness));
    const rnd = rng(1907);
    const segs: Seg[] = [];
    const grow = (x: number, y: number, ang: number, depth: number, t: number) => {
      if (depth > 9 || y > H + 30) return;
      const len = (H / 13) * (0.65 + rnd() * 0.7) * Math.pow(0.93, depth);
      const nx = x + Math.sin(ang) * len;
      const ny = y + Math.cos(ang) * len * (0.8 + rnd() * 0.3);
      const t1 = t + 0.05 + rnd() * 0.03;
      segs.push({
        x, y, nx, ny, depth,
        t0: t, t1,
        gold: rnd() < 0.05 + 0.14 * gg,
        ph: rnd() * 6.28,
        cr: 0, cg: 0, cb: 0,
      });
      const kids = rnd() < 0.38 && depth < 7 ? 2 : 1;
      for (let i = 0; i < kids; i++) {
        grow(nx, ny, ang + (rnd() - 0.5) * 0.85 + (kids === 2 ? (i ? 0.4 : -0.4) : 0), depth + 1, t1);
      }
    };
    const cols = 10;
    for (let i = 0; i < cols; i++) {
      grow(W * (0.05 + (0.9 * i) / (cols - 1)) + (rnd() - 0.5) * 40, -10, (rnd() - 0.5) * 0.45, 0, rnd() * 0.22);
    }
    let mx = 0;
    segs.forEach((s) => { if (s.t1 > mx) mx = s.t1; });
    segs.forEach((s) => { s.t0 /= mx; s.t1 /= mx; });
    segs.forEach((s) => {
      const f = Math.min(1, s.depth / 8);
      const mix = gg * (1 - f * 0.75);
      s.cr = Math.round(139 + (201 - 139) * mix);
      s.cg = Math.round(107 + (168 - 107) * mix);
      s.cb = Math.round(74 + (76 - 74) * mix);
    });
    const spores = Array.from({ length: 26 }, () => ({
      x: rnd() * W,
      y: rnd() * H,
      v: 6 + rnd() * 14,
      ph: rnd() * 6.28,
      r: 0.8 + rnd() * 1.4,
    }));
    const t0 = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const g = reduced ? 1 : Math.min(1, t / 6.5);
      ctx.clearRect(0, 0, W, H);
      for (const s of segs) {
        const p = Math.max(0, Math.min(1, (g - s.t0) / (s.t1 - s.t0)));
        if (p <= 0) continue;
        const shimmer = reduced ? 0 : Math.sin(t * 0.7 + s.ph) * 0.05;
        const a = s.gold ? 0.55 + shimmer * 2 : Math.max(0.12, 0.46 * Math.pow(0.87, s.depth)) + shimmer;
        ctx.strokeStyle = s.gold
          ? `rgba(201,168,76,${Math.max(0.18, a)})`
          : `rgba(${s.cr},${s.cg},${s.cb},${Math.max(0.05, a)})`;
        ctx.lineWidth = Math.max(0.5, 3.1 * Math.pow(0.84, s.depth));
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + (s.nx - s.x) * p, s.y + (s.ny - s.y) * p);
        ctx.stroke();
        if (s.gold && p === 1) {
          ctx.fillStyle = `rgba(201,168,76,${0.4 + shimmer * 3})`;
          ctx.beginPath();
          ctx.arc(s.nx, s.ny, 1.8, 0, 6.29);
          ctx.fill();
        }
      }
      if (!reduced) {
        for (const sp of spores) {
          const yy = ((((sp.y - t * sp.v) % (H + 20)) + H + 20) % (H + 20)) - 10;
          const xx = sp.x + Math.sin(t * 0.5 + sp.ph) * 14;
          ctx.fillStyle = `rgba(201,168,76,${0.08 + 0.06 * Math.sin(t + sp.ph)})`;
          ctx.beginPath();
          ctx.arc(xx, yy, sp.r, 0, 6.29);
          ctx.fill();
        }
        raf = requestAnimationFrame(draw);
      }
    };
    if (reduced) draw(t0 + 99999);
    else raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [goldenness]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}
