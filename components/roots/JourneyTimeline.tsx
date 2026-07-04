'use client';

import { useState } from 'react';
import Link from 'next/link';
import { orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import type { JourneyEvent, Ring, Root } from '@/types/goals';

const COLLAPSED_COUNT = 8;

function formatDate(millis: number): string {
  return new Date(millis).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function EventIcon({ type }: { type: JourneyEvent['type'] }) {
  switch (type) {
    case 'entry_linked':
      return <span className="text-dream" aria-hidden>📖</span>;
    case 'micro_win':
      return <span className="inline-block h-2 w-2 rounded-full bg-gold" aria-hidden />;
    case 'ring_achieved':
      return <span className="text-gold" aria-hidden>◎</span>;
    case 'fruit_completed':
      return <span className="text-sage" aria-hidden>✓</span>;
    case 'week_reset':
      return <span className="text-muted-foreground" aria-hidden>⟳</span>;
  }
}

function EventBody({ event }: { event: JourneyEvent }) {
  switch (event.type) {
    case 'entry_linked':
      return (
        <Link href={`/journal/${event.entryId}`} className="group block">
          <span className="block text-sm text-foreground group-hover:text-gold transition-colors">
            {event.entryTitle || 'Journal entry'}
          </span>
          {event.entryExcerpt && (
            <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
              {event.entryExcerpt}
            </span>
          )}
        </Link>
      );
    case 'micro_win':
      return <span className="text-sm text-foreground/90">Win: {event.label}</span>;
    case 'ring_achieved':
      return <span className="text-sm text-foreground/90">Ring laid down: {event.label}</span>;
    case 'fruit_completed':
      return <span className="text-sm text-foreground/90">Fruit ripened: {event.label}</span>;
    case 'week_reset': {
      const done = event.snapshot?.filter((s) => s.status === 'done').length ?? 0;
      const total = event.snapshot?.length ?? 0;
      return (
        <span className="text-xs text-muted-foreground">
          Week closed — {done}/{total} practices done
        </span>
      );
    }
  }
}

export function JourneyTimeline({ root }: { root: Root }) {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const { data: events, loading } = useFirestore<JourneyEvent>(
    user ? `users/${user.uid}/roots/${root.id}/events` : '',
    orderBy('createdAt', 'desc')
  );

  // The soonest upcoming ring is the target the trunk is currently growing toward.
  const currentRing: Ring | undefined = root.rings
    .filter((r) => !r.achievedAt)
    .sort((a, b) => a.targetDate - b.targetDate)[0];
  const visible = showAll ? events : events.slice(0, COLLAPSED_COUNT);

  if (loading) return null;

  if (events.length === 0 && !currentRing) {
    return (
      <p className="py-2 text-sm text-muted-foreground/70">
        The trunk is bare — link a journal entry or complete a practice to begin the journey.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Trunk · the journey
        </span>
        {events.length > 0 && (
          <span className="rounded-full border border-border/60 bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        )}
      </div>

      <ol className="relative ml-2 space-y-3 border-l border-border/40 pl-4">
        {/* Upcoming ring target sits at the top of the trunk */}
        {currentRing && (
          <li className="relative">
            <span className="absolute -left-[1.42rem] top-1 flex h-3 w-3 items-center justify-center">
              <span className="h-2.5 w-2.5 rounded-full border border-gold/70 bg-transparent" />
            </span>
            <div className="flex items-start justify-between gap-3 rounded-lg border border-dashed border-gold/25 bg-gold/5 px-3 py-2">
              <span className="text-sm text-gold/90">Growing toward: {currentRing.label}</span>
              <span className="whitespace-nowrap rounded-full border border-gold/25 px-2 py-0.5 text-[10px] text-gold/80">
                {formatDate(currentRing.targetDate)}
              </span>
            </div>
          </li>
        )}

        {visible.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[1.42rem] top-1 flex h-3 w-3 items-center justify-center text-[10px]">
              <EventIcon type={event.type} />
            </span>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <EventBody event={event} />
              </div>
              <span className="whitespace-nowrap rounded-full border border-border/60 bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
                {formatDate(event.type === 'entry_linked' && event.entryDate ? event.entryDate : event.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {events.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? '⌃ Show fewer' : `⌄ Show all ${events.length}`}
        </button>
      )}
    </div>
  );
}
