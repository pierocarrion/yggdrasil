'use client';

import type { ReactNode } from 'react';

interface PathOption {
  route: string;
  title: string;
  body: string;
  icon: ReactNode;
}

function buildPaths(entryPath: string): PathOption[] {
  return [
    {
      route: entryPath,
      title: 'See your full reflection',
      body: 'Open this entry — your insight, in full.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      ),
    },
    {
      route: '/entries',
      title: 'Walk your entries',
      body: "Revisit what you've written, kept alive.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 0 1 4.5 10.125v-4.5C4.5 5.004 5.004 4.5 5.625 4.5Z" />
        </svg>
      ),
    },
    {
      route: '/roots',
      title: 'See your Living Tree',
      body: 'Where goals take root and grow.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
        </svg>
      ),
    },
  ];
}

interface ThreePathsProps {
  /** The seed entry's detail route (e.g. /journal/abc123) — opens it to its full insight. */
  entryPath: string;
  onChoose: (route: string) => void;
  disabled?: boolean;
}

/**
 * 2f / 2l — feature intro compressed into one choice: the user picks their own
 * second step, then Yggi dissolves into the app shell. The first path opens the
 * seed entry on its detail page, where the full InsightCard (questions, depth,
 * connections) lives — the trimmed reveal above is just the first taste. All
 * three destinations are ordinary app routes; onboarding is already complete.
 * Cards warm their border to gold/30 on hover (the quiet DS hover, no lift).
 */
export function ThreePaths({ entryPath, onChoose, disabled = false }: ThreePathsProps) {
  const paths = buildPaths(entryPath);
  return (
    <nav aria-label="Where to next" className="flex w-full flex-col items-center gap-8">
      <h2 className="font-display text-3xl font-light sm:text-4xl">Where to next?</h2>
      <div className="flex w-full max-w-[940px] flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
        {paths.map((path) => (
          <button
            key={path.route}
            type="button"
            onClick={() => onChoose(path.route)}
            disabled={disabled}
            className="group flex w-full items-center gap-4 rounded-xl border border-border/60 bg-surface-2 p-6 text-left transition-colors duration-300 hover:border-gold/30 disabled:opacity-50 sm:w-[300px] sm:flex-col sm:items-start sm:gap-3 sm:p-7"
          >
            <span className="flex-none text-sage">{path.icon}</span>
            <span className="flex flex-col gap-0.5 sm:gap-2">
              <span className="font-display text-xl leading-snug sm:text-2xl">{path.title}</span>
              <span className="text-sm leading-relaxed text-foreground/55">{path.body}</span>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
