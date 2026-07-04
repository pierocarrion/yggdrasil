'use client';

import { useMemo, useState } from 'react';
import { orderBy, where } from 'firebase/firestore';
import { RootsTracker } from './_tracker';
import { RootCard } from '@/components/roots/RootCard';
import { CreateRootDialog } from '@/components/roots/CreateRootDialog';
import { FeatureGate } from '@/components/billing/FeatureGate';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { useSubscription } from '@/hooks/useSubscription';
import type { Root, RootLinkSuggestion } from '@/types/goals';

const FREE_ROOTS_LIMIT = 5;

export default function RootsPage() {
  const { user } = useAuth();
  const subscription = useSubscription();
  const [creating, setCreating] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: roots, loading } = useFirestore<Root>(
    user ? `users/${user.uid}/roots` : '',
    orderBy('createdAt', 'desc')
  );
  const { data: suggestions } = useFirestore<RootLinkSuggestion>(
    user ? `users/${user.uid}/rootSuggestions` : '',
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  const suggestionsByRoot = useMemo(() => {
    const map = new Map<string, RootLinkSuggestion[]>();
    for (const suggestion of suggestions) {
      const list = map.get(suggestion.rootId) ?? [];
      list.push(suggestion);
      map.set(suggestion.rootId, list);
    }
    return map;
  }, [suggestions]);

  const active = roots.filter((r) => r.status === 'active');
  const completed = roots.filter((r) => r.status === 'completed');
  const archived = roots.filter((r) => r.status === 'archived');

  const isFree = subscription.entitlement !== 'PRO';
  const atFreeCap = isFree && active.length >= FREE_ROOTS_LIMIT;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <RootsTracker />

      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-3">Living Tree</h1>
          <p className="text-muted-foreground">
            Your roots — the values and goals you tend — and the journeys, practices, and wins growing from them.
          </p>
        </div>
        {!atFreeCap && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
          >
            + Plant a root
          </button>
        )}
      </div>

      {atFreeCap && (
        <div className="mb-8">
          <FeatureGate
            blocked
            label={`Grow more than ${FREE_ROOTS_LIMIT} roots with Pro.`}
          />
        </div>
      )}

      {loading && (
        <p className="py-12 text-center text-sm text-muted-foreground animate-pulse">
          Reading the roots…
        </p>
      )}

      {!loading && roots.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <p className="font-display text-xl text-foreground/90">Nothing planted yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            A root is a value you keep tending or a goal you grow toward. Your journal entries
            become its journey; your weekly practices, its branches.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-5 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
          >
            + Plant your first root
          </button>
        </div>
      )}

      <div className="space-y-4">
        {active.map((root) =>
          root.gated ? (
            <FeatureGate key={root.id} blocked overlay label="This root is beyond the free tier.">
              <RootCard root={root} suggestions={[]} />
            </FeatureGate>
          ) : (
            <RootCard
              key={root.id}
              root={root}
              suggestions={suggestionsByRoot.get(root.id) ?? []}
              defaultExpanded={active.length === 1}
            />
          )
        )}
      </div>

      {completed.length > 0 && (
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCompleted ? '⌄' : '›'} Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-4">
              {completed.map((root) => (
                <RootCard key={root.id} root={root} suggestions={[]} />
              ))}
            </div>
          )}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showArchived ? '⌄' : '›'} Archived ({archived.length})
          </button>
          {showArchived && (
            <div className="space-y-4">
              {archived.map((root) => (
                <RootCard key={root.id} root={root} suggestions={[]} />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateRootDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
