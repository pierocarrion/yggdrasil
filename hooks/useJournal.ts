import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { JournalEntry } from '@/types/journal';
import { logEntryCreated, logEntryEdited, logEntryDeleted } from '@/lib/analytics/client';
import { useAuth } from './useAuth';
import { createConverter } from '@/lib/firebase/converters';

export function useJournal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addEntry = async (entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Must be logged in to add an entry');
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, `users/${user.uid}/entries`).withConverter(createConverter<JournalEntry>());
      const docRef = await addDoc(colRef, {
        ...entry,
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any);

      logEntryCreated({
        entry_type: entry.entryType,
        has_mood: !!entry.mood,
        tag_count: entry.tags.length,
        word_count: entry.wordCount,
      });

      return docRef.id;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
    if (!user) throw new Error('Must be logged in to update an entry');
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, `users/${user.uid}/entries/${entryId}`);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Date.now(),
      });

      logEntryEdited();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!user) throw new Error('Must be logged in to delete an entry');
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, `users/${user.uid}/entries/${entryId}`);
      await deleteDoc(docRef);

      logEntryDeleted();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addEntry, updateEntry, deleteEntry, loading, error };
}
