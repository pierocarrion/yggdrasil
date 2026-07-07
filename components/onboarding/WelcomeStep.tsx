'use client';

import { useEffect, useRef } from 'react';
import { Logo } from '@/components/marketing/Logo';
import { GeometryBackdrop } from './SacredGeometry';
import { PrimaryButton } from './PrimaryButton';

interface WelcomeStepProps {
  onBegin: () => void;
}

/**
 * 2b / 2h — one breath. No setup, nothing to configure. Rethemed around seed &
 * roots rather than "your journal." Focus starts on Begin so a keyboard user
 * passes through with a single keypress (a11y commitment 2p).
 */
export function WelcomeStep({ onBegin }: WelcomeStepProps) {
  const beginRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    beginRef.current?.focus();
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-7 text-center sm:gap-7">
      <GeometryBackdrop size={720} opacity={0.16} />

      <div className="relative flex flex-col items-center gap-6 sm:gap-7">
        <Logo size={48} />
        <h1 className="font-display text-4xl font-light leading-tight sm:text-[3.5rem]">
          Welcome to Yggdrasil.
        </h1>
        <div className="flex flex-col gap-2.5">
          <p className="font-display text-xl italic text-foreground/80">
            Every great tree begins as a single seed.
          </p>
          <p className="text-sm text-sage sm:text-base">
            Plant one thought — Yggi will show you what takes root.
          </p>
        </div>
        <PrimaryButton ref={beginRef} size="lg" onClick={onBegin} className="mt-3.5">
          Begin
        </PrimaryButton>
      </div>
    </div>
  );
}
