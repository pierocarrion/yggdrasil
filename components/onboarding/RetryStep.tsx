'use client';

import { PrimaryButton } from './PrimaryButton';

interface RetryStepProps {
  /** The user's preserved seed text, shown so trust survives the stumble. */
  entryText: string;
  /** When the entry was written, e.g. "Today · 09:12". */
  timestamp: string;
  onRetry: () => void;
  onContinue: () => void;
  retrying?: boolean;
}

/**
 * 2n — graceful retry on a *true* failure only (never during the first 60s).
 * The preserved entry is shown so the user knows nothing was lost; retry
 * re-triggers analysis on the same entry. No error codes, no stack traces, no red.
 */
export function RetryStep({ entryText, timestamp, onRetry, onContinue, retrying = false }: RetryStepProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-2xl italic text-foreground/85">The forest lost the thread.</p>
      <p className="text-sm text-muted-foreground sm:text-base">Your entry is safe — every word of it.</p>

      <div className="flex w-full max-w-[520px] flex-col gap-2 rounded-xl border border-border/40 bg-surface-2 px-6 py-5 text-left">
        <span className="font-mono text-xs text-foreground/40">{timestamp}</span>
        <p className="text-sm leading-relaxed text-foreground/80 sm:text-base">{entryText}</p>
      </div>

      <div className="mt-1.5 flex flex-col items-center gap-3 sm:flex-row">
        <PrimaryButton onClick={onRetry} disabled={retrying}>
          {retrying ? 'Trying…' : 'Try again'}
        </PrimaryButton>
        <button
          type="button"
          onClick={onContinue}
          disabled={retrying}
          className="rounded-sm px-5 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
        >
          Continue to your journal
        </button>
      </div>
    </div>
  );
}
