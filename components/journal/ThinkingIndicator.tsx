'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreDoc } from '@/hooks/useFirestore';
import type { JournalEntry } from '@/types/journal';
import { toast } from 'sonner';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Link from 'next/link';

interface ThinkingIndicatorProps {
  entryId: string;
}

export function ThinkingIndicator({ entryId }: ThinkingIndicatorProps) {
  const { user } = useAuth();
  const { data: entry } = useFirestoreDoc<JournalEntry>(
    user ? `users/${user.uid}/entries/${entryId}` : ''
  );
  
  const previousStatus = useRef(entry?.analysisStatus);

  useEffect(() => {
    // If the entry just transitioned from pending to completed
    if (previousStatus.current === 'pending' && entry?.analysisStatus === 'complete') {
      const checkForPatterns = async () => {
        if (!user) return;
        try {
          const connectionsRef = collection(db, `users/${user.uid}/connections`);
          
          // Edges can have our entryId as either source or target. We check both.
          const q1 = query(connectionsRef, where('sourceId', '==', entryId), where('weak', '==', false));
          const q2 = query(connectionsRef, where('targetId', '==', entryId), where('weak', '==', false));
          
          const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          const connections = [...snap1.docs, ...snap2.docs].map(d => d.data());
          
          if (connections.length > 0) {
            // Find the strongest connection
            connections.sort((a, b) => b.similarity - a.similarity);
            const strongest = connections[0];
            const relatedEntryId = strongest.sourceId === entryId ? strongest.targetId : strongest.sourceId;
            
            // Fetch the related entry title
            const relatedDoc = await getDoc(doc(db, `users/${user.uid}/entries/${relatedEntryId}`));
            if (relatedDoc.exists()) {
              const relatedData = relatedDoc.data() as JournalEntry;
              const dateStr = relatedData.createdAt 
                ? new Date(relatedData.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                : 'the past';
              const title = relatedData.title || 'a previous entry';
              
              toast('This pattern feels familiar...', {
                icon: <span className="text-xl animate-pulse">✨</span>,
                description: `It shares deep themes with "${title}" from ${dateStr}.`,
                duration: 8000,
                action: {
                  label: 'View Insights',
                  onClick: () => window.location.href = '/insights'
                }
              });
            }
          }
        } catch (e) {
          console.error("Failed to check for patterns", e);
        }
      };
      
      checkForPatterns();
    }
    
    previousStatus.current = entry?.analysisStatus;
  }, [entry?.analysisStatus, entryId, user]);

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
