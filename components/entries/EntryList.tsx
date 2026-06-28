'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs, getDocsFromServer, startAfter, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import type { JournalEntry } from '@/types/journal';
import { createConverter } from '@/lib/firebase/converters';

const PAGE_SIZE = 10;

interface SearchEventPayload {
  search_type: 'full_text';
  query: string;
}

export function EntryList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<JournalEntry> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionData, setConnectionData] = useState<Record<string, { count: number; theme: string | null }>>({});

  // New states added for handling search functionality
  const [searchQuery, setSearchQuery] = useState('');

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

      // Start logic with newEntries which is defined above
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

      // Fire off connection data fetch asynchronously to not block UI render
      if (newEntries.length > 0) {
        (async () => {
          try {
            const entryIds = newEntries.map(e => e.id);
            const connectionsRef = collection(db, `users/${user.uid}/connections`);
            
            // Firestore 'in' supports up to 10 items, matching our PAGE_SIZE perfectly.
            const q1 = query(connectionsRef, where('sourceId', 'in', entryIds));
            const q2 = query(connectionsRef, where('targetId', 'in', entryIds));
            
            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            
            const newConnectionData: Record<string, { count: number; theme: string | null }> = {};
            
            snap1.docs.forEach(doc => {
              const data = doc.data();
              if (data.weak !== false && data.similarity <= 0.8) return;
              const existing = newConnectionData[data.sourceId] || { count: 0, theme: null };
              newConnectionData[data.sourceId] = {
                count: existing.count + 1,
                theme: existing.theme || data.theme || data.reason || null
              };
            });
            
            snap2.docs.forEach(doc => {
              const data = doc.data();
              if (data.weak !== false && data.similarity <= 0.8) return;
              const existing = newConnectionData[data.targetId] || { count: 0, theme: null };
              newConnectionData[data.targetId] = {
                count: existing.count + 1,
                theme: existing.theme || data.theme || data.reason || null
              };
            });

            if (isInitial) {
              setConnectionData(newConnectionData);
            } else {
              setConnectionData(prev => {
                const merged = { ...prev };
                Object.keys(newConnectionData).forEach(k => {
                  if (merged[k]) {
                    merged[k].count += newConnectionData[k].count;
                    merged[k].theme = merged[k].theme || newConnectionData[k].theme;
                  } else {
                    merged[k] = newConnectionData[k];
                  }
                });
                return merged;
              });
            }
          } catch (e) {
            console.error("Failed to fetch connection counts", e);
          }
        })();
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
      setSearchQuery(''); // Clear search on mount/user change
      fetchEntries(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Helper method added to handle firing the entry_search tracking event
  const fireEntrySearch = useCallback((queryStr: string) => {
    const eventPayload: SearchEventPayload = {
      search_type: 'full_text',
      query: queryStr
    };
    window.dispatchEvent(new CustomEvent('entry_search', { detail: eventPayload }));
  }, []);

  // Handler added to catch input mutations, evaluate triggers, and check for empty strings
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    const trimmed = value.trim();
    if (trimmed) {
      fireEntrySearch(trimmed);
    }
  };

  // Memoized filter added to keep mutations clear and instantly restore on clear
  const filteredEntries = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return entries;
    }

    const lowerCaseQuery = trimmedQuery.toLowerCase();
    return entries.filter(entry => 
      entry.content.toLowerCase().includes(lowerCaseQuery)
    );
  }, [entries, searchQuery]);

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
      {/* Search Input elements structurally added at the top of list container */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="🔍 Search entries by content..."
          className="w-full px-4 py-2.5 bg-surface-2 border border-border/40 focus:border-gold/60 focus:outline-none rounded-xl text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/60"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        // Fallback interface block added when queries leave zero content matches
        <div className="text-center py-12 border border-border/20 rounded-xl bg-surface-2/10">
          <p className="text-muted-foreground text-sm">No entries matched your search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
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
                    {new Date(entry.entryDate || entry.createdAt).toLocaleDateString(undefined, {
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
                    {connectionData[entry.id]?.count >= 2 && (
                      <div className="relative group/badge">
                        <span className="px-2.5 py-1 bg-surface rounded-full text-[10px] uppercase tracking-wider text-gold border border-gold/40 flex items-center gap-1 shadow-[0_0_10px_rgba(212,175,55,0.1)] cursor-help">
                          ✨ Feels familiar ({connectionData[entry.id].count})
                        </span>
                        {connectionData[entry.id].theme && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-surface border border-border/60 rounded shadow-lg text-[10px] text-foreground/80 opacity-0 group-hover/badge:opacity-100 pointer-events-none transition-opacity z-10 text-center">
                            Pattern: {connectionData[entry.id].theme}
                          </div>
                        )}
                      </div>
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
      )}

      {/* Pagination wrapper logic adjusted to hide button explicitly when an active search query is applied */}
      {hasMore && !searchQuery.trim() && (
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