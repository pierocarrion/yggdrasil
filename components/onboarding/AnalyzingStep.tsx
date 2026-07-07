'use client';

import type { ReactNode } from 'react';
import { SacredGeometry } from './SacredGeometry';

interface Teaser {
  title: string;
  body: string;
  icon: ReactNode;
}

const TEASERS: Teaser[] = [
  {
    title: 'Entries',
    body: 'Every reflection, kept alive and searchable.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 0 1 4.5 10.125v-4.5C4.5 5.004 5.004 4.5 5.625 4.5Z" />
      </svg>
    ),
  },
  {
    title: 'Living Tree',
    body: 'Your goals grow roots through what you write.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
      </svg>
    ),
  },
  {
    title: 'Insights',
    body: 'Patterns surface across time — themes, moods, connections.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-1.813-5.096L2.091 14.1l5.096-.813L9 8.192l.813 5.095 5.096.813-5.096 1.804zM19.071 4.929l-.354 1.06-.353-1.06-.354-.354 1.06-.353.354 1.06.353-1.06.354.354-1.06.353-.354-1.06z" />
      </svg>
    ),
  },
];

/**
 * 2d / 2j — the wait *is* the feature tour. Yggi's geometry breathes while the
 * teaser cards rise in one at a time, so by the time the insight lands the app
 * has already introduced itself. The status line reuses the shipped
 * ThinkingIndicator pattern (role="status" aria-live="polite"), announced once;
 * the teasers are labelled as a group for screen readers.
 */
export function AnalyzingStep() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-7 px-5 py-10">
      <SacredGeometry size={104} breathe className="sm:hidden" />
      <SacredGeometry size={112} breathe className="hidden sm:inline-flex" />

      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2.5 font-display text-xl italic text-gold sm:text-2xl"
      >
        <span className="ygg-breathe inline-block h-1.5 w-1.5 rounded-full bg-gold" />
        Yggi is reading…
      </div>

      <ul
        aria-label="What Yggdrasil can do"
        className="mt-1 flex w-full max-w-[460px] flex-col gap-3.5"
      >
        {TEASERS.map((teaser, i) => (
          <li
            key={teaser.title}
            className="ygg-rise flex items-start gap-4 rounded-xl border border-border/40 bg-surface-2 px-5 py-4"
            style={{ animationDelay: `${0.3 + i * 1.3}s` }}
          >
            <span className="mt-0.5 flex-none text-sage">{teaser.icon}</span>
            <div className="flex flex-col gap-1">
              <span className="font-display text-lg leading-snug sm:text-xl">{teaser.title}</span>
              <span className="text-sm text-foreground/60">{teaser.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
