'use client';

import { useEffect, useRef } from 'react';
import { setupCanvas, prefersReducedMotion } from './canvas';

const NODES = [
  { x: 250, y: 120, r: 20, c: '201,168,76', l: 'Reflection', pulse: true },
  { x: 120, y: 70, r: 11, c: '123,174,138' },
  { x: 110, y: 190, r: 13, c: '123,174,138' },
  { x: 250, y: 235, r: 12, c: '139,107,74' },
  { x: 370, y: 80, r: 14, c: '123,174,138' },
  { x: 400, y: 195, r: 16, c: '139,123,174', l: 'Dream', pulse: true },
  { x: 480, y: 120, r: 10, c: '139,107,74' },
] as { x: number; y: number; r: number; c: string; l?: string; pulse?: boolean }[];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6], [3, 5], [2, 3],
];

/**
 * "Your mind, mapped" card: a knowledge graph that draws itself (~2.4s) when
 * scrolled into view, then drifts and pulses. Ported from the design
 * prototype's playGraph().
 */
export function GraphDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let played = false;

    const play = (startP: number, reduced: boolean) => {
      const env = setupCanvas(canvasRef, 280);
      if (!env) return;
      const { ctx, W, H } = env;
      const sx = W / 560;
      const sy = H / 300;
      const t0 = performance.now();
      const draw = (now: number) => {
        const el = (now - t0) / 1000;
        const p = reduced ? 1 : Math.min(1, startP + el / 2.4);
        const t = el;
        ctx.clearRect(0, 0, W, H);
        const pos = NODES.map((n, i) => {
          const drift = reduced || p < 1 ? 0 : 1;
          return {
            x: n.x * sx + drift * Math.sin(t * 0.5 + i * 1.9) * 2.5,
            y: n.y * sy + drift * Math.cos(t * 0.4 + i * 1.3) * 2.5,
          };
        });
        EDGES.forEach(([a, b], i) => {
          const w0 = 0.25 + i * 0.07;
          const ep = Math.max(0, Math.min(1, (p - w0) / 0.18));
          if (ep <= 0) return;
          ctx.strokeStyle = 'rgba(42,64,53,0.95)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(pos[a].x, pos[a].y);
          ctx.lineTo(pos[a].x + (pos[b].x - pos[a].x) * ep, pos[a].y + (pos[b].y - pos[a].y) * ep);
          ctx.stroke();
        });
        NODES.forEach((n, i) => {
          const w0 = i * 0.06;
          const np = Math.max(0, Math.min(1, (p - w0) / 0.2));
          if (np <= 0) return;
          const ease = 1 - Math.pow(1 - np, 3);
          const pulse = n.pulse && !reduced && p >= 1 ? 1 + 0.06 * Math.sin(t * 1.6 + i) : 1;
          const r = n.r * Math.min(1, sx) * ease * pulse;
          ctx.fillStyle = `rgba(${n.c},0.85)`;
          ctx.beginPath();
          ctx.arc(pos[i].x, pos[i].y, r, 0, 6.29);
          ctx.fill();
          if (n.l && p > 0.75) {
            ctx.fillStyle = `rgba(232,224,208,${Math.min(0.75, (p - 0.75) * 3)})`;
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(n.l, pos[i].x, pos[i].y + r + 16);
          }
        });
        if (!reduced) raf = requestAnimationFrame(draw);
      };
      if (reduced) draw(t0 + 99999);
      else raf = requestAnimationFrame(draw);
    };

    const reduced = prefersReducedMotion();
    if (reduced) {
      played = true;
      play(1, true);
      return () => cancelAnimationFrame(raf);
    }
    const check = () => {
      if (played || !canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.8 && r.bottom > 0) {
        played = true;
        play(0, false);
      }
    };
    const timer = setInterval(check, 350);
    check();
    return () => {
      clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      data-reveal="120"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-2)',
        border: '1px solid rgba(42,64,53,0.6)',
        borderRadius: 12,
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--foreground)' }}>
          Your mind, mapped
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-foreground)' }}>
          48 entries · 9 clusters
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 280 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 280 }} />
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(232,224,208,0.6)', margin: '4px 0 0' }}>
        Semantically similar entries drift together into clusters, so recurring themes become visible — an honest
        portrait of what keeps returning.
      </p>
    </div>
  );
}
