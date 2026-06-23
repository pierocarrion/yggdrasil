import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { geminiapikey, generateFromAudio } from '../lib/gemini';

const TRANSCRIPTION_PROMPT =
  'Transcribe this audio recording verbatim into clean, readable text. ' +
  'Add natural paragraph breaks. Do not summarize, interpret, or add commentary — ' +
  'return only the transcript.';

/**
 * Detects MIME type from a Storage file path extension.
 */
function mimeFromPath(path: string): string {
  if (path.endsWith('.mp4')) return 'audio/mp4';
  if (path.endsWith('.ogg')) return 'audio/ogg';
  // Default to webm (the primary recording format)
  return 'audio/webm';
}

/**
 * Cloud Function: transcribeAudio
 *
 * Callable that reads an audio file from Firebase Storage, sends it to
 * Gemini for multimodal transcription, and returns the transcript.
 *
 * Auth guard mirrors the pattern in yggi/chat.ts.
 */
export const transcribeAudio = onCall(
  {
    secrets: [geminiapikey],
    // Audio files can be large — allow up to 180s for processing
    timeoutSeconds: 180,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { userId, storagePath } = data as {
      userId?: string;
      storagePath?: string;
    };

    if (!userId || !storagePath) {
      throw new HttpsError(
        'invalid-argument',
        'Missing userId or storagePath.'
      );
    }

    if (userId !== auth.uid) {
      throw new HttpsError(
        'permission-denied',
        'Cannot transcribe audio for another user.'
      );
    }

    // Validate the storage path is under the user's own directory
    if (!storagePath.startsWith(`users/${userId}/`)) {
      throw new HttpsError(
        'permission-denied',
        'Storage path must be under the user\'s own directory.'
      );
    }

    try {
      logger.info('[transcribeAudio] Starting transcription', {
        userId,
        storagePath,
      });

      // 1. Download the audio file from Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);

      const [exists] = await file.exists();
      if (!exists) {
        throw new HttpsError('not-found', 'Audio file not found in Storage.');
      }

      const [buffer] = await file.download();
      const audioBase64 = buffer.toString('base64');
      const mimeType = mimeFromPath(storagePath);

      logger.info('[transcribeAudio] Audio downloaded', {
        sizeBytes: buffer.length,
        mimeType,
      });

      // 2. Transcribe with Gemini
      const transcript = await generateFromAudio(
        audioBase64,
        mimeType,
        TRANSCRIPTION_PROMPT
      );

      logger.info('[transcribeAudio] Transcription complete', {
        userId,
        transcriptLength: transcript.length,
      });

      return { transcript };
    } catch (error) {
      logger.error('[transcribeAudio] Failed', { userId, storagePath, error });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        `Transcription failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);
