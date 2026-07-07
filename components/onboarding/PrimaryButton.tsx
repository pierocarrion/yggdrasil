import React, { forwardRef } from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  size?: 'md' | 'lg';
}

/**
 * The Yggdrasil primary action button. Its signature affordance is a 2.5px gold
 * line on the left edge that scales up on hover — an organic, tactile response
 * instead of a color pop (see brand.md motion notes, and Composer's Save button).
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  function PrimaryButton(
    { fullWidth = false, size = 'md', className = '', children, ...props },
    ref,
  ) {
    const pad = size === 'lg' ? 'py-3 pl-9 pr-7 text-[13px]' : 'py-2.5 pl-8 pr-6 text-xs';
    return (
      <button
        ref={ref}
        {...props}
        className={`group relative overflow-hidden rounded-sm border border-gold/40 bg-primary font-medium uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${pad} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
      >
        <span className="pointer-events-none absolute bottom-1 left-0 top-1 w-[2.5px] origin-center scale-y-0 bg-gold transition-transform duration-300 group-hover:scale-y-100" />
        {children}
      </button>
    );
  },
);
