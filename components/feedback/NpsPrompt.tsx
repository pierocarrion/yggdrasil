'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { toast } from 'sonner';
import {
  markFeedbackSubmitted,
  submitFeedback,
  type FeedbackTrigger,
} from '@/lib/feedback';

interface NpsPromptProps {
  userId: string;
  trigger: FeedbackTrigger;
  onClose: () => void;
}

const SCORES = Array.from({ length: 11 }, (_, index) => index);

export function NpsPrompt({ userId, trigger, onClose }: NpsPromptProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !submitting) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (score === null || submitting) return;

    setSubmitting(true);

    try {
      await submitFeedback({
        userId,
        score,
        comment,
        trigger,
      });
      markFeedbackSubmitted(userId);
      toast.success('Thank you for helping Yggdrasil grow.');
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback', error);
      toast.error('Feedback could not be sent. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nps-prompt-title"
      aria-describedby="nps-prompt-description"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-border/60 bg-surface-2 p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gold">
              A quick reflection
            </p>
            <h2
              id="nps-prompt-title"
              className="font-display text-2xl text-foreground sm:text-3xl"
            >
              How likely are you to recommend Yggdrasil?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            autoFocus
            className="shrink-0 rounded-sm px-2 py-1 text-xl leading-none text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
            aria-label="Dismiss feedback prompt"
          >
            ×
          </button>
        </div>

        <p
          id="nps-prompt-description"
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
        >
          Your answer helps us understand what is useful and what needs more care.
        </p>

        <fieldset className="mt-6">
          <legend className="sr-only">
            Recommendation score from 0 to 10
          </legend>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
            {SCORES.map((value) => {
              const selected = score === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScore(value)}
                  aria-label={`${value} out of 10`}
                  aria-pressed={selected}
                  className={`aspect-square rounded-lg border text-sm font-medium transition-colors ${
                    selected
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-border/60 bg-surface text-foreground/80 hover:border-sage/60 hover:text-foreground'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
            <span>Not likely</span>
            <span>Extremely likely</span>
          </div>
        </fieldset>

        <label className="mt-6 block">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Anything else you&apos;d like us to know? (optional)
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="What has felt valuable—or what could be better?"
            className="mt-2 w-full resize-y rounded-lg border border-border/60 bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none"
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={score === null || submitting}
            className="rounded-lg border border-gold/30 bg-gold/10 px-5 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
