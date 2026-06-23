import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/client';
import type { EntryType } from '@/components/journal/EntryTypeSelector';
import type { MoodState } from '@/components/journal/MoodSliders';

export interface CreateEntryPayload {
  userId: string;
  content: string;
  entryType?: EntryType | null;
  mood?: MoodState | null;
}

/**
 * Creates a new journal entry in Firestore.
 * This function handles writing the data shape and sets analysisStatus to 'pending'.
 * The backend Cloud Function (analyzeEntry) triggers off this creation.
 *
 * @param payload - The data needed to create the entry.
 * @returns The generated entry ID.
 */
export async function createEntry(payload: CreateEntryPayload): Promise<string> {
  const { userId, content, entryType, mood } = payload;
  
  if (!userId) {
    throw new Error('User ID is required to create an entry.');
  }
  
  if (!content || !content.trim()) {
    throw new Error('Entry content cannot be empty.');
  }

  // Create a new reference with an auto-generated ID inside users/{userId}/entries
  const entryRef = doc(collection(db, `users/${userId}/entries`));
  const entryId = entryRef.id;

  const entryData: Record<string, any> = {
    userId,
    content,
    tags: [], // Always initialize with empty tags
    analysisStatus: 'pending',
    createdAt: serverTimestamp(),
  };

  if (entryType) {
    entryData.entryType = entryType;
  }

  if (mood && mood.label !== 'Unset') {
    entryData.moodPolarity = mood.polarity;
    entryData.moodIntensity = mood.intensity;
    entryData.moodLabel = mood.label;
  }

  await setDoc(entryRef, entryData);

  return entryId;
}

export async function updateEntry(
  userId: string,
  entryId: string,
  payload: Partial<CreateEntryPayload>
): Promise<void> {
  const { content, entryType, mood } = payload;
  const entryRef = doc(db, `users/${userId}/entries/${entryId}`);
  
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (content !== undefined) {
    updateData.content = content;
    // Re-trigger analysis when content changes
    updateData.analysisStatus = 'pending';
  }

  if (entryType !== undefined) {
    updateData.entryType = entryType === null ? null : entryType;
  }

  if (mood !== undefined) {
    if (mood === null || mood.label === 'Unset') {
      updateData.moodPolarity = null;
      updateData.moodIntensity = null;
      updateData.moodLabel = null;
    } else {
      updateData.moodPolarity = mood.polarity;
      updateData.moodIntensity = mood.intensity;
      updateData.moodLabel = mood.label;
    }
  }

  await setDoc(entryRef, updateData, { merge: true });
}

import { deleteDoc } from 'firebase/firestore';

export async function deleteEntry(userId: string, entryId: string): Promise<void> {
  const entryRef = doc(db, `users/${userId}/entries/${entryId}`);
  await deleteDoc(entryRef);
}
