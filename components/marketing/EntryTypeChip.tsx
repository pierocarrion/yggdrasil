'use client';

import { useState, type CSSProperties } from 'react';

const TYPE_COLORS: Record<string, string> = {
  Reflection: 'var(--sage)',
  Gratitude: 'var(--gold)',
  Dream: 'var(--dream)',
  Event: 'var(--earth)',
  Other: 'var(--foreground)',
};

export function EntryTypeChip({
  type = 'Reflection',
  selected = false,
  onToggle,
  style = {},
}: {
  type?: string;
  selected?: boolean;
  onToggle?: () => void;
  style?: CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  const color = TYPE_COLORS[type] || TYPE_COLORS.Other;
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={selected}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-body-md)',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
        background: selected
          ? 'rgba(26,60,46,0.5)'
          : hover
            ? 'rgba(42,64,53,0.4)'
            : 'rgba(42,64,53,0.2)',
        color: selected ? color : hover ? 'var(--foreground)' : 'rgba(232,224,208,0.7)',
        border: `1px solid ${selected ? color : 'var(--border-soft)'}`,
        ...style,
      }}
    >
      {type}
    </button>
  );
}
