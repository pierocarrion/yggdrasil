import type { RefObject } from 'react';

/** Seeded PRNG so the generative art is deterministic across visits. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Size a canvas to its CSS box (optionally a fixed height) at device pixel ratio. */
export function setupCanvas(ref: RefObject<HTMLCanvasElement | null>, fixedH?: number) {
  const c = ref.current;
  if (!c) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = c.clientWidth;
  const H = fixedH || c.clientHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  return { ctx, W, H };
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
