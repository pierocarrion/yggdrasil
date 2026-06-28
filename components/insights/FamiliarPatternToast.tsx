'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function FamiliarPatternToast() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Wait a brief moment before turning on the listener to avoid the initial data load
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!user || !isReady) return;

    const connectionsRef = collection(db, `users/${user.uid}/connections`);
    // We order by createdAt so we only get the absolute newest connection when it is added
    const q = query(connectionsRef, orderBy('createdAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // We only care about brand new connections being added while the user is active
        if (change.type === 'added') {
          const data = change.doc.data();
          
          // Only trigger for strong connections
          if (data.weak === false || data.similarity > 0.8) {
            const theme = data.theme || data.reason || 'recurring pattern';
            
            toast('You\'ve been here before', {
              description: `This pattern feels familiar... ${theme}`,
              duration: 8000,
              icon: (
                <svg className="w-5 h-5 text-gold animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              style: {
                background: 'var(--surface-2)',
                borderColor: 'var(--gold)',
                color: 'var(--foreground)'
              }
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, isReady]);

  return null;
}
