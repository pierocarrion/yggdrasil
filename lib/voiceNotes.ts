import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, storage } from './firebase/client';

/**
 * Uploads a voice note audio blob to Firebase Storage.
 *
 * @param userId - The authenticated user's ID.
 * @param audioBlob - The recorded audio Blob.
 * @param draftId - A unique ID for this recording session.
 * @returns The Storage path of the uploaded file.
 */
export async function uploadVoiceNote(
  userId: string,
  audioBlob: Blob,
  draftId: string
): Promise<string> {
  // Determine extension from MIME type
  const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
  const storagePath = `users/${userId}/voiceNotes/${draftId}.${ext}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, audioBlob);

  return storagePath;
}

/**
 * Calls the transcribeAudio Cloud Function to get a Gemini-powered transcript.
 *
 * @param userId - The authenticated user's ID.
 * @param storagePath - The Storage path of the uploaded audio file.
 * @returns The transcript text.
 */
export async function transcribeVoiceNote(
  userId: string,
  storagePath: string
): Promise<string> {
  const functions = getFunctions(app);
  const callable = httpsCallable<
    { userId: string; storagePath: string },
    { transcript: string }
  >(functions, 'transcribeAudio', { timeout: 180000 });

  const result = await callable({ userId, storagePath });
  return result.data.transcript;
}

/**
 * Gets the download URL for a voice note (for future replay).
 *
 * @param storagePath - The Storage path of the audio file.
 * @returns A publicly accessible download URL.
 */
export async function getVoiceNoteUrl(storagePath: string): Promise<string> {
  const storageRef = ref(storage, storagePath);
  return getDownloadURL(storageRef);
}
