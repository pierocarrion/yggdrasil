'use client';

import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/marketing/Logo';
import { VoiceRecorder } from '@/components/journal/VoiceRecorder';
import { PrimaryButton } from './PrimaryButton';

interface SeedPromptStepProps {
  /** Plant the seed entry. Receives the plain-text content the user wrote. */
  onPlant: (text: string) => void;
  /** "Not yet — look around first" — skip the seed and go to the app. */
  onSkip: () => void;
  /** Disables the controls while the entry is being created. */
  submitting?: boolean;
}

const PLACEHOLDER =
  'I keep wondering if this new city will ever feel like mine. Everyone else seems to already belong somewhere.';

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * 2c / 2i — one prompt, one box, one CTA (YGG-42). No mood sliders, tags, or
 * toolbar; those come later in the real composer. The textarea is autofocused;
 * Voice runs the shipped record→transcribe path. The example is a real, dimmed
 * placeholder that clears the moment the user types.
 */
export function SeedPromptStep({ onPlant, onSkip, submitting = false }: SeedPromptStepProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isRecording) textareaRef.current?.focus();
  }, [isRecording]);

  const words = countWords(text);
  const canPlant = words > 0 && !submitting;

  const handleTranscript = (transcript: string) => {
    setText((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
    setIsRecording(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter plants the entry — Enter alone still adds newlines.
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canPlant) {
      event.preventDefault();
      onPlant(text.trim());
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-7 px-5 py-10 sm:px-6">
      <div className="absolute left-0 right-0 top-9 flex justify-center">
        <Logo size={24} />
      </div>

      <div className="flex w-full max-w-[720px] flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-[1.625rem] font-normal italic leading-snug text-gold sm:text-[2.5rem] sm:leading-tight">
            “What&apos;s one thing on your mind right now?”
          </h1>
          <p className="text-sm text-foreground/50">Just a sentence or two is enough.</p>
        </div>

        {isRecording ? (
          <div className="flex min-h-[240px] w-full items-center justify-center rounded-xl border border-border/60 bg-surface-2">
            <VoiceRecorder
              onTranscriptReady={handleTranscript}
              onCancel={() => setIsRecording(false)}
            />
          </div>
        ) : (
          <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-surface-2 shadow-md">
            <label htmlFor="seed-entry" className="sr-only">
              Your first entry
            </label>
            <textarea
              id="seed-entry"
              ref={textareaRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={submitting}
              placeholder={PLACEHOLDER}
              rows={5}
              className="min-h-[200px] w-full resize-none bg-transparent p-8 text-base leading-relaxed text-foreground outline-none placeholder:text-foreground/30 disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-3 border-t border-border/40 bg-surface px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setIsRecording(true)}
                  disabled={submitting}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-sm px-3 py-2 text-sage transition-colors hover:bg-sage/10 disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="1" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                  </svg>
                  Voice
                </button>
                <span
                  className="font-mono text-xs text-foreground/35"
                  aria-live="polite"
                >
                  {words} {words === 1 ? 'word' : 'words'}
                </span>
              </div>
              <PrimaryButton onClick={() => onPlant(text.trim())} disabled={!canPlant}>
                {submitting ? 'Planting…' : 'Plant your first entry'}
              </PrimaryButton>
            </div>
          </div>
        )}

        {!isRecording && (
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className="text-sm text-foreground/45 underline decoration-dotted decoration-foreground/35 underline-offset-[3px] transition-colors hover:text-foreground/70 disabled:opacity-50"
          >
            Not yet — look around first →
          </button>
        )}
      </div>
    </div>
  );
}
