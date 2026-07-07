import type { CSSProperties } from 'react';

/**
 * Yggi's sacred-geometry form — a Flower-of-Life mandala rendered in gold.
 *
 * Yggi is a *formless* guide (never a raven or creature); this geometry is how
 * it appears when it is present or "speaking." Rings are graded in opacity so
 * the form reads as depth rather than a flat stamp.
 *
 * The same mark serves two roles:
 *  - `<SacredGeometry />`  — a foreground presence (the wait / insight screens),
 *    optionally `breathe`-ing.
 *  - `<GeometryBackdrop />` — a large, dim field behind a screen. Intentionally
 *    more visible than a hairline watermark so the mysticism is felt, not hidden.
 */

const GOLD = '#C9A84C';

/** The nine overlapping circles of the seed/flower of life, with graded emphasis. */
const RINGS: { cx: number; cy: number; r: number; opacity: number }[] = [
  { cx: 60, cy: 60, r: 57, opacity: 0.25 },
  { cx: 60, cy: 60, r: 40, opacity: 0.45 },
  { cx: 60, cy: 60, r: 20, opacity: 1 },
  { cx: 60, cy: 40, r: 20, opacity: 0.65 },
  { cx: 60, cy: 80, r: 20, opacity: 0.65 },
  { cx: 42.7, cy: 50, r: 20, opacity: 0.65 },
  { cx: 77.3, cy: 50, r: 20, opacity: 0.65 },
  { cx: 42.7, cy: 70, r: 20, opacity: 0.65 },
  { cx: 77.3, cy: 70, r: 20, opacity: 0.65 },
];

interface SacredGeometryProps {
  /** Rendered pixel size (width & height). */
  size?: number;
  /** Overall opacity multiplier applied to the whole mark. */
  opacity?: number;
  /** Stroke weight of the rings. */
  strokeWidth?: number;
  /** When true, the mark gently breathes (disabled under prefers-reduced-motion). */
  breathe?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SacredGeometry({
  size = 112,
  opacity = 1,
  strokeWidth = 1,
  breathe = false,
  className = '',
  style = {},
}: SacredGeometryProps) {
  return (
    <span
      className={`${breathe ? 'ygg-breathe ' : ''}inline-flex ${className}`}
      style={{ opacity, ...style }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        {RINGS.map((ring, i) => (
          <circle
            key={i}
            cx={ring.cx}
            cy={ring.cy}
            r={ring.r}
            stroke={GOLD}
            strokeOpacity={ring.opacity}
            strokeWidth={strokeWidth}
          />
        ))}
      </svg>
    </span>
  );
}

interface GeometryBackdropProps {
  /** Size of the mandala; defaults to a large field. */
  size?: number;
  /** Field opacity. Higher than a hairline watermark so it's felt, not hidden. */
  opacity?: number;
}

/**
 * Full-bleed, centered geometry field for the calmer screens (sign-up, welcome).
 * Pointer-events off; sits behind the content.
 */
export function GeometryBackdrop({ size = 680, opacity = 0.14 }: GeometryBackdropProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <SacredGeometry size={size} opacity={opacity} strokeWidth={0.6} />
    </div>
  );
}
