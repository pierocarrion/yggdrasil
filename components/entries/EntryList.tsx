'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import type { JournalEntry } from '@/types/journal';
import { createConverter } from '@/lib/firebase/converters';

const PAGE_SIZE = 10;

export function EntryList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<JournalEntry> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEntries = useCallback(async (isInitial = false) => {
    if (!user) return;

    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const entriesRef = collection(db, `users/${user.uid}/entries`).withConverter(createConverter<JournalEntry>());
      
      let q = query(entriesRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      
      if (!isInitial && lastVisible) {
        q = query(entriesRef, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);
      
      const newEntries = snapshot.docs.map(doc => doc.data());
      
      if (isInitial) {
        setEntries(newEntries);
      } else {
        setEntries(prev => [...prev, ...newEntries]);
      }

      // If we received fewer items than requested, we've reached the end
      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, lastVisible]);

  useEffect(() => {
    // Reset state and fetch initial entries when component mounts or user changes
    if (user) {
      setEntries([]);
      setLastVisible(null);
      setHasMore(true);
      fetchEntries(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-surface-2 rounded-xl border border-border/40"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/10 border border-red-900/20 rounded-xl text-center">
        <p className="text-red-400">Failed to load entries.</p>
        <button onClick={() => fetchEntries(true)} className="mt-4 text-sm text-gold hover:text-gold/80">
          Try again
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-border/40 bg-surface-2/30 rounded-xl">
        <svg className="w-12 h-12 text-sage/50 mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
        </svg>
        <h3 className="text-xl font-display text-foreground mb-2">Your roots begin here</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          You haven&apos;t written any journal entries yet. Once you do, they will appear here in chronological order.
        </p>
        <Link 
          href="/journal"
          className="px-6 py-2.5 bg-primary text-foreground border border-gold/40 rounded-sm hover:bg-primary/90 transition-all duration-300 font-medium text-xs tracking-wider uppercase"
        >
          Write First Entry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {entries.map((entry) => {
          // Strip HTML from content for the preview
          const plainText = entry.content.replace(/<[^>]+>/g, ' ');
          const preview = plainText.length > 150 ? plainText.slice(0, 150).trim() + '...' : plainText;

          return (
            <Link 
              key={entry.id} 
              href={`/journal/${entry.id}`}
              className="block p-6 bg-surface-2 hover:bg-surface-2/80 border border-border/60 hover:border-gold/40 transition-all duration-300 rounded-xl group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <time className="text-sm text-gold/80 font-medium tracking-wide" suppressHydrationWarning>
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </time>

                <div className="flex items-center gap-2 flex-wrap">
                  {entry.entryType && (
                    <span className="px-2.5 py-1 bg-surface rounded-full text-[10px] uppercase tracking-wider text-foreground/80 border border-border/50">
                      {entry.entryType}
                    </span>
                  )}
                  {entry.moodLabel && entry.moodLabel !== 'Unset' && (
                    <span className="px-2.5 py-1 bg-surface rounded-full text-[10px] uppercase tracking-wider text-sage border border-sage/20">
                      {entry.moodLabel}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-foreground/80 leading-relaxed text-sm group-hover:text-foreground transition-colors">
                {preview}
              </p>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="pt-6 flex justify-center">
          <button
            onClick={() => fetchEntries(false)}
            disabled={loadingMore}
            className="px-6 py-2.5 text-xs font-medium tracking-wider uppercase text-gold hover:text-gold/80 hover:bg-surface-2 rounded-sm transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
