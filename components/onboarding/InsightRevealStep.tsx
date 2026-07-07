'use client';

import { useEffect, useRef, useState } from 'react';
import type { EntryAnalysis } from '@/types/journal';
import { SacredGeometry } from './SacredGeometry';
import { ThreePaths } from './ThreePaths';

interface InsightRevealStepProps {
  analysis: EntryAnalysis;
  /** Detail route of the seed entry, so "See your full reflection" opens it. */
  entryPath: string;
  onChoose: (route: string) => void;
  choosing?: boolean;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 2e / 2k — the insight arrives as Yggi's reply. The real InsightCard anatomy,
 * trimmed for a first meeting: eyebrow, the italic serif insight, then themes +
 * resonant emotions (no collapsibles yet). Focus moves to the "First insight"
 * heading and the insight text reads before the tags. After a beat, the three
 * paths (2f/2l) rise beneath — one continuous scroll, nothing hidden.
 */
export function InsightRevealStep({ analysis, entryPath, onChoose, choosing = false }: InsightRevealStepProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [showPaths, setShowPaths] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShowPaths(true);
      return;
    }
    const timer = setTimeout(() => setShowPaths(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const insight = analysis.interpretation?.main_insight?.trim();
  const themes = analysis.themes ?? [];
  const emotions = analysis.emotions ?? [];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-14 sm:gap-7 sm:px-6">
      <SacredGeometry size={60} opacity={0.85} />

      <p className="font-display text-xl italic text-foreground/85 sm:text-2xl">Here&apos;s what I see —</p>

      <div className="flex w-full max-w-[640px] flex-col gap-5 rounded-xl border border-border/60 bg-surface-2 p-6 shadow-sm sm:gap-[22px] sm:p-9">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-[11px] font-semibold uppercase tracking-widest text-gold/80 outline-none sm:text-xs"
        >
          First insight
        </h2>

        {insight && (
          <p className="font-display text-xl italic leading-relaxed sm:text-[1.75rem]">
            “{insight}”
          </p>
        )}

        {(themes.length > 0 || emotions.length > 0) && (
          <div className="flex flex-col gap-5 border-t border-border/40 pt-5 sm:flex-row sm:gap-10">
            {themes.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Themes</span>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme, i) => (
                    <span
                      key={`${theme}-${i}`}
                      className="rounded-full border border-border/50 bg-surface px-3 py-1 text-xs text-foreground/90"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {emotions.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Resonant emotions</span>
                <div className="flex flex-wrap gap-2">
                  {emotions.map((emotion, i) => {
                    const positive = emotion.polarity > 5;
                    const negative = emotion.polarity < 5;
                    const tone = positive
                      ? 'bg-sage/10 text-sage border-sage/20'
                      : negative
                        ? 'bg-red-900/10 text-red-300 border-red-900/20'
                        : 'bg-surface text-foreground/80 border-border/50';
                    return (
                      <span
                        key={`${emotion.label}-${i}`}
                        className={`rounded-full border px-3 py-1 text-xs ${tone}`}
                      >
                        {emotion.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-sm italic text-sage sm:text-base">
        When you&apos;re ready, I&apos;ll watch for how this evolves.
      </p>

      {showPaths && (
        <div className="ygg-rise mt-6 w-full">
          <ThreePaths entryPath={entryPath} onChoose={onChoose} disabled={choosing} />
        </div>
      )}
    </div>
  );
}
