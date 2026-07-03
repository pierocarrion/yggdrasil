'use client';

import { useState, type ButtonHTMLAttributes, type CSSProperties } from 'react';

type Props = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: CSSProperties;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const SIZES: Record<string, CSSProperties> = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.6875rem' },
  md: { padding: '0.625rem 1.5rem', fontSize: '0.75rem' },
  lg: { padding: '0.75rem 2rem', fontSize: '0.8125rem' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
  children,
  style = {},
  ...rest
}: Props) {
  const [hover, setHover] = useState(false);
  const variants: Record<string, CSSProperties> = {
    primary: {
      background: 'var(--primary)',
      color: 'var(--foreground)',
      border: '1px solid var(--gold-line)',
    },
    secondary: {
      background: 'var(--surface-2)',
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: hover ? 'var(--foreground)' : 'rgba(232,224,208,0.6)',
      border: '1px solid transparent',
    },
    gold: {
      background: hover ? 'rgba(201,168,76,0.2)' : 'var(--gold-soft)',
      color: 'var(--gold)',
      border: '1px solid var(--gold-line)',
    },
    destructive: {
      background: 'rgba(139,58,58,0.15)',
      color: '#E7B7B7',
      border: '1px solid rgba(139,58,58,0.5)',
    },
  };
  const v = variants[variant] || variants.primary;
  const hasEdge = variant === 'primary';
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        borderRadius: 'var(--radius)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition:
          'background 300ms cubic-bezier(0.4,0,0.2,1), color 300ms cubic-bezier(0.4,0,0.2,1), border-color 300ms cubic-bezier(0.4,0,0.2,1)',
        paddingLeft: hasEdge ? '2rem' : (SIZES[size].padding as string).split(' ')[1],
        ...SIZES[size],
        ...v,
        ...(hover && variant === 'primary' ? { background: 'rgba(26,60,46,0.9)' } : null),
        ...(hover && variant === 'secondary' ? { background: 'var(--muted)' } : null),
        ...style,
      }}
      {...rest}
    >
      {hasEdge && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            bottom: 4,
            width: '2.5px',
            background: 'var(--gold)',
            transform: hover ? 'scaleY(1)' : 'scaleY(0)',
            transformOrigin: 'center',
            transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      )}
      {children}
    </button>
  );
}
