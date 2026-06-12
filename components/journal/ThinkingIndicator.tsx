'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreDoc } from '@/hooks/useFirestore';
import type { JournalEntry } from '@/types/journal';

interface ThinkingIndicatorProps {
  entryId: string;
}

export function ThinkingIndicator({ entryId }: ThinkingIndicatorProps) {
  const { user } = useAuth();
  const { data: entry } = useFirestoreDoc<JournalEntry>(
    user ? `users/${user.uid}/entries/${entryId}` : ''
  );

  if (!entry || entry.analysisStatus !== 'pending') {
    return null;
  }

  return (
    <div 
      className="text-gold italic font-display text-sm animate-pulse flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
      <span>Yggdrasil is thinking...</span>
    </div>
  );
}
