'use client';

import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { confirmSuggestion, dismissSuggestion } from '@/lib/roots';
import { logRootEntryLinked, logRootSuggestionDismissed } from '@/lib/analytics/client';
import type { RootLinkSuggestion } from '@/types/goals';

function formatDate(millis: number): string {
  return new Date(millis).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** A pending AI suggestion to weave a journal entry into this root's journey. */
export function SuggestionBanner({ suggestion }: { suggestion: RootLinkSuggestion }) {
  const { user } = useAuth();

  if (!user) return null;

  const handleConfirm = async () => {
    try {
      await confirmSuggestion(user.uid, suggestion);
      logRootEntryLinked({ source: 'suggestion' });
      toast.success('Entry woven into the journey');
    } catch (error) {
      console.error('Failed to confirm suggestion', error);
      toast.error('Failed to link entry');
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissSuggestion(user.uid, suggestion.id);
      logRootSuggestionDismissed();
    } catch (error) {
      console.error('Failed to dismiss suggestion', error);
    }
  };

  return (
    <div className="rounded-xl border border-dream/25 bg-dream/5 p-3">
      <p className="text-xs text-dream/90">
        ✦ This entry seems to belong to this journey
      </p>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {suggestion.entryTitle && (
            <p className="text-sm text-foreground">{suggestion.entryTitle}</p>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.entryExcerpt}</p>
        </div>
        <span className="whitespace-nowrap rounded-full border border-border/60 bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
          {formatDate(suggestion.entryDate)}
        </span>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Not this one
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-lg border border-dream/30 bg-dream/10 px-3 py-1 text-xs text-dream hover:bg-dream/20 transition-colors"
        >
          Weave it in
        </button>
      </div>
    </div>
  );
}
