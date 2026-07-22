import { VertexAI } from '@google-cloud/vertexai';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

// GEMINI_API_KEY is kept as a defineSecret for backwards compatibility with the
// existing deploy environment. We no longer read it: this app authenticates to
// Gemini via Vertex AI using the runtime service account (Application Default
// Credentials). The secret is allowed to be unset.
export const geminiapikey = defineSecret('GEMINI_API_KEY');

// Project + region for Vertex AI. Provided as plain env vars by Cloud Run /
// Cloud Functions secrets manager (no Secret Manager bind required).
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'yggdrasil-yggi';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

// Lazy-init so secrets are resolved at runtime, not at module load.
let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    vertexAI = new VertexAI({ project: PROJECT, location: LOCATION });
  }
  return vertexAI;
}

/**
 * Default models as specified by LAU-AI-01 requirements.
 * Vertex AI exposes Gemini models under publishers/google/models/<name>.
 */
export const DEFAULT_MODEL = 'gemini-3.5-flash';
export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';

/**
 * Configuration options for generating content.
 */
export interface GenerateTextOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

/**
 * Generates text using the Gemini model via Vertex AI.
 * Authentication uses the runtime service account (ADC) — no API key needed.
 *
 * @param prompt The prompt to send to the model.
 * @param options Optional configuration.
 * @returns The generated text string.
 */
export async function generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
  const modelName = options?.model || DEFAULT_MODEL;

  try {
    const generativeModel = getVertexAI().getGenerativeModel({
      model: modelName,
      systemInstruction: options?.systemInstruction,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxOutputTokens,
        responseMimeType: options?.responseMimeType,
      },
    });

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      return text;
    }

    throw new Error('Vertex AI returned an empty response.');
  } catch (error) {
    logger.error('Error generating text with Vertex AI:', error);
    if (error instanceof Error) {
      throw new Error(`GeminiTextGenerationError: ${error.message}`);
    }
    throw new Error('GeminiTextGenerationError: Unknown error occurred.');
  }
}

/**
 * Generates embeddings using the specified embedding model on Vertex AI.
 *
 * @param text The text to generate embeddings for.
 * @returns Array of 768-dim numbers.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddingModel = getVertexAI().getGenerativeModel(
      { model: DEFAULT_EMBEDDING_MODEL }
    );

    const result = await embeddingModel.embedContent({
      contents: [{ role: 'user', parts: [{ text }] }],
    });

    const values = (result as { embedding?: { values?: number[] } }).embedding?.values;
    if (values && values.length > 0) {
      return values.slice(0, 768);
    }

    throw new Error('Embedding values were empty in response.');
  } catch (error) {
    logger.error('Error generating embedding with Vertex AI:', error);
    if (error instanceof Error) {
      throw new Error(`GeminiEmbeddingGenerationError: ${error.message}`);
    }
    throw new Error('GeminiEmbeddingGenerationError: Unknown error occurred.');
  }
}

/**
 * Generates text from an audio input using Gemini's multimodal capabilities on
 * Vertex AI (used for voice-note transcription).
 *
 * @param audioBase64 Base64-encoded audio data.
 * @param mimeType MIME type (e.g. 'audio/webm', 'audio/mp4').
 * @param prompt Text prompt to accompany the audio.
 * @param options Optional configuration.
 * @returns The generated text string.
 */
export async function generateFromAudio(
  audioBase64: string,
  mimeType: string,
  prompt: string,
  options?: GenerateTextOptions
): Promise<string> {
  const modelName = options?.model || DEFAULT_MODEL;

  try {
    const generativeModel = getVertexAI().getGenerativeModel({
      model: modelName,
      systemInstruction: options?.systemInstruction,
      generationConfig: {
        temperature: options?.temperature ?? 0.1,
        maxOutputTokens: options?.maxOutputTokens,
        responseMimeType: options?.responseMimeType,
      },
    });

    const result = await generativeModel.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: audioBase64 } },
          { text: prompt },
        ],
      }],
    });
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      return text;
    }

    throw new Error('Vertex AI returned an empty response for audio input.');
  } catch (error) {
    logger.error('Error generating text from audio with Vertex AI:', error);
    if (error instanceof Error) {
      throw new Error(`GeminiAudioGenerationError: ${error.message}`);
    }
    throw new Error('GeminiAudioGenerationError: Unknown error occurred.');
  }
}
