'use client';

import { useState } from 'react';
import Link from 'next/link';
import { orderBy, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { linkEntryToRoot, unlinkEntryFromRoot } from '@/lib/roots';
import { logRootEntryLinked, logJourneyStarted } from '@/lib/analytics/client';
import type { Root } from '@/types/goals';
import type { JournalEntry } from '@/types/journal';

/**
 * Shows which Roots an entry belongs to and lets the user weave it into
 * another root's journey.
 */
export function LinkRootPicker({ entry }: { entry: JournalEntry }) {
  const { user } = useAuth();
  const [picking, setPicking] = useState(false);

  const { data: roots } = useFirestore<Root>(
    user ? `users/${user.uid}/roots` : '',
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  if (!user) return null;

  const linkedIds = entry.linkedRootIds ?? [];
  const linked = roots.filter((r) => linkedIds.includes(r.id));
  const available = roots.filter((r) => !linkedIds.includes(r.id) && !r.gated);

  if (roots.length === 0) return null;

  const handleLink = async (root: Root) => {
    try {
      await linkEntryToRoot(user.uid, root.id, entry, 'manual');
      logRootEntryLinked({ source: 'manual' });
      if (linkedIds.length === 0) {
        logJourneyStarted();
      }
      setPicking(false);
      toast.success(`Woven into “${root.title}”`);
    } catch (error) {
      console.error('Failed to link entry to root', error);
      toast.error('Failed to link entry');
    }
  };

  const handleUnlink = async (root: Root) => {
    try {
      await unlinkEntryFromRoot(user.uid, root.id, entry.id);
    } catch (error) {
      console.error('Failed to unlink entry from root', error);
      toast.error('Failed to unlink entry');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">Roots</span>
      {linked.map((root) => (
        <span
          key={root.id}
          className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
            root.kind === 'value'
              ? 'border-sage/30 bg-sage/10 text-sage'
              : 'border-gold/30 bg-gold/10 text-gold'
          }`}
        >
          <Link href="/roots" className="hover:underline">
            {root.title}
          </Link>
          <button
            type="button"
            onClick={() => handleUnlink(root)}
            className="opacity-50 transition-opacity hover:opacity-100"
            aria-label={`Remove from ${root.title}`}
          >
            ×
          </button>
        </span>
      ))}

      {available.length > 0 && !picking && (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          + Add to a root
        </button>
      )}

      {picking && (
        <span className="flex flex-wrap items-center gap-1.5">
          {available.map((root) => (
            <button
              key={root.id}
              type="button"
              onClick={() => handleLink(root)}
              className="rounded-full border border-border/60 bg-surface px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-gold/40 hover:text-gold"
            >
              {root.title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPicking(false)}
            className="px-1.5 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            ×
          </button>
        </span>
      )}
    </div>
  );
}
