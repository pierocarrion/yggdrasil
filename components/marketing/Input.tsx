'use client';

import { useState, type CSSProperties, type InputHTMLAttributes } from 'react';

type Props = {
  label?: string;
  containerStyle?: CSSProperties;
  style?: CSSProperties;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  label,
  id,
  type = 'text',
  disabled = false,
  style = {},
  containerStyle = {},
  ...rest
}: Props) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...containerStyle }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 'var(--text-label)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--sage)',
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          color: 'var(--foreground)',
          border: `1px solid ${focus ? 'var(--gold-line)' : 'var(--border-soft)'}`,
          borderRadius: 'var(--radius)',
          padding: '0.625rem 0.875rem',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-body-md)',
          outline: 'none',
          transition: 'border-color 300ms cubic-bezier(0.4,0,0.2,1)',
          opacity: disabled ? 0.5 : 1,
          boxSizing: 'border-box',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}
