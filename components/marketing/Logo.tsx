import type { CSSProperties } from 'react';

type Props = {
  size?: number;
  showWordmark?: boolean;
  color?: string;
  wordmarkColor?: string;
  gap?: number;
  style?: CSSProperties;
};

export function Logo({
  size = 24,
  showWordmark = false,
  color = 'var(--gold)',
  wordmarkColor = 'var(--foreground)',
  gap = 10,
  style = {},
}: Props) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden={showWordmark ? 'true' : undefined}
      role={showWordmark ? undefined : 'img'}
      aria-label={showWordmark ? undefined : 'Yggdrasil'}
      style={showWordmark ? { color, flexShrink: 0 } : { color, flexShrink: 0, ...style }}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M32 60 V36" strokeWidth="3" />
        <g strokeWidth="2.4">
          <path d="M32 42 C32 36 24 34 17 31" />
          <path d="M32 42 C32 36 40 34 47 31" />
          <path d="M32 36 C32 28 25 25 20 20" />
          <path d="M32 36 C32 28 39 25 44 20" />
          <path d="M32 30 C32 22 29 18 27 13" />
          <path d="M32 30 C32 22 35 18 37 13" />
          <path d="M32 26 V9" />
        </g>
        <g strokeWidth="1.7" opacity="0.9">
          <path d="M22 32 C19 32 16 34 13 37" />
          <path d="M42 32 C45 32 48 34 51 37" />
          <path d="M24 22 C21 21 18 22 15 25" />
          <path d="M40 22 C43 21 46 22 49 25" />
        </g>
      </g>
      <g fill="currentColor">
        <circle cx="32" cy="7" r="2.4" />
        <circle cx="27" cy="13" r="2" />
        <circle cx="37" cy="13" r="2" />
        <circle cx="20" cy="20" r="2.2" />
        <circle cx="44" cy="20" r="2.2" />
        <circle cx="17" cy="31" r="2.4" />
        <circle cx="47" cy="31" r="2.4" />
        <circle cx="13" cy="37" r="1.8" />
        <circle cx="51" cy="37" r="1.8" />
        <circle cx="15" cy="25" r="1.6" />
        <circle cx="49" cy="25" r="1.6" />
      </g>
    </svg>
  );

  if (!showWordmark) {
    return mark;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, ...style }}>
      {mark}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: size * 0.72,
          letterSpacing: '0.1em',
          color: wordmarkColor,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        YGGDRASIL
      </span>
    </span>
  );
}
