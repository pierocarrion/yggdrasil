'use client';

import { useState, type CSSProperties } from 'react';

type Props = {
  title: string;
  price: string;
  description: string;
  badge?: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
};

function badgeStyle(color: string, bg: string, border: string): CSSProperties {
  return {
    position: 'absolute',
    right: '1rem',
    top: '1rem',
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${border}`,
    background: bg,
    padding: '0.25rem 0.75rem',
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color,
  };
}

export function PlanCard({
  title,
  price,
  description,
  badge,
  subtext,
  actionLabel = 'Choose plan',
  onAction,
}: Props) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        background: 'var(--surface)',
        border: '1px solid rgba(42,64,53,0.6)',
        color: 'var(--foreground)',
      }}
    >
      {badge ? (
        <span style={badgeStyle('var(--gold)', 'var(--gold-soft)', 'var(--gold-line)')}>
          {badge}
        </span>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-card)',
            fontWeight: 500,
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: '2.25rem', margin: 0, lineHeight: 1.1 }}>{price}</p>
        <p
          style={{
            fontSize: 'var(--text-body-md)',
            lineHeight: 1.6,
            color: 'rgba(232,224,208,0.7)',
            margin: 0,
          }}
        >
          {description}
        </p>
        {subtext && (
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--sage)',
              margin: 0,
              transition: 'opacity 300ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {subtext}
          </p>
        )}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <button
          type="button"
          onClick={onAction}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            width: '100%',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1rem',
            fontSize: 'var(--text-body-md)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 300ms cubic-bezier(0.4,0,0.2,1)',
            border: '1px solid var(--gold-line)',
            background: hover ? 'rgba(201,168,76,0.2)' : 'var(--gold-soft)',
            color: 'var(--gold)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
