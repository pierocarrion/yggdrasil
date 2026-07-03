import type { CSSProperties, ReactNode } from 'react';

export type TagVariant = 'neutral' | 'positive' | 'negative' | 'keyword' | 'framework';

const VARIANTS: Record<TagVariant, CSSProperties> = {
  neutral: {
    background: 'var(--surface)',
    color: 'rgba(232,224,208,0.9)',
    border: '1px solid rgba(42,64,53,0.5)',
  },
  positive: {
    background: 'var(--sage-soft)',
    color: 'var(--sage)',
    border: '1px solid var(--sage-line)',
  },
  negative: {
    background: 'rgba(139,58,58,0.12)',
    color: '#E0A5A5',
    border: '1px solid rgba(139,58,58,0.25)',
  },
  keyword: {
    background: 'var(--surface)',
    color: 'rgba(232,224,208,0.7)',
    border: '1px solid var(--border-soft)',
  },
  framework: {
    background: 'var(--surface-2)',
    color: 'rgba(232,224,208,0.8)',
    border: '1px solid var(--gold-line)',
  },
};

export function Tag({
  variant = 'neutral',
  children,
  style = {},
}: {
  variant?: TagVariant;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-body-sm)',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
