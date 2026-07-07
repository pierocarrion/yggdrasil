'use client';

import { SacredGeometry } from './SacredGeometry';

interface HoldingStepProps {
  /** "Continue to your journal — Yggi will bring it to you" — leave and let the
   *  insight surface wherever the user lands (the shipped Familiar-pattern toast). */
  onContinue: () => void;
}

/**
 * 2m — the >60s holding screen (YGG-44 / XPE-ONBRD-03). Swaps in only after 60s
 * still pending. The geometry dims and slows — never a spinner, countdown, or
 * error. The exit link is real: if taken, onboarding completes and the insight
 * finds the user later. Announced once via the live region.
 */
export function HoldingStep({ onContinue }: HoldingStepProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <SacredGeometry size={88} opacity={0.4} />
      <p className="font-display text-2xl italic text-foreground/85">
        Some reflections take a little longer to trace.
      </p>
      <p className="text-sm text-muted-foreground sm:text-base">Your insight will find you here.</p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-2 text-sm text-foreground/45 underline decoration-dotted decoration-foreground/35 underline-offset-[3px] transition-colors hover:text-foreground/70"
      >
        Continue to your journal — Yggi will bring it to you →
      </button>
    </div>
  );
}
