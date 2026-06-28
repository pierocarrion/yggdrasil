import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

export const geminiapikey = defineSecret('GEMINI_API_KEY');

// Initialize genAI lazily so it picks up the secret at runtime
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY is not set. Gemini API calls will fail.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}


/**
 * Default models as specified by LAU-AI-01 requirements.
 */
export const DEFAULT_MODEL = 'gemini-3.5-flash';
export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';

/**
 * Configuration options for generating content.
 */
export interface GenerateTextOptions {
  /**
   * The model to use. Defaults to `gemini-2.0-flash`.
   * Only upgrade or override off flash with a documented reason (coding standard).
   */
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

/**
 * Generates text using the Gemini model via Google Generative AI SDK.
 * All Gemini calls in the codebase MUST route through this function.
 *
 * @param prompt - The prompt to send to the model.
 * @param options - Optional configuration for the model.
 * @returns The generated text string.
 */
export async function generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
  const modelName = options?.model || DEFAULT_MODEL;

  try {
    const generativeModel = getGenAI().getGenerativeModel({
      model: modelName,
      systemInstruction: options?.systemInstruction,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxOutputTokens,
        responseMimeType: options?.responseMimeType,
      },
    }, { apiVersion: 'v1alpha' });

    const result = await generativeModel.generateContent(prompt);
    const responseText = result.response.text();
    
    if (responseText) {
      return responseText;
    }
    
    throw new Error('Gemini API returned an empty response.');
  } catch (error) {
    logger.error('Error generating text with Gemini:', error);
    if (error instanceof Error) {
      throw new Error(`GeminiTextGenerationError: ${error.message}`);
    }
    throw new Error('GeminiTextGenerationError: Unknown error occurred.');
  }
}

/**
 * Generates embeddings using the specified embedding model.
 *
 * @param text - The text to generate embeddings for.
 * @returns An array of numbers representing the embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddingModel = getGenAI().getGenerativeModel(
      { model: DEFAULT_EMBEDDING_MODEL }
    );

    const result = await embeddingModel.embedContent(text);
    if (result.embedding?.values) {
      // Truncate to 768 dimensions via MRL as requested by the user
      return result.embedding.values.slice(0, 768);
    }
    
    throw new Error('Embedding values were empty in response.');
  } catch (error) {
    logger.error('Error generating embedding with Gemini:', error);
    if (error instanceof Error) {
      throw new Error(`GeminiEmbeddingGenerationError: ${error.message}`);
    }
    throw new Error('GeminiEmbeddingGenerationError: Unknown error occurred.');
  }
}

/**
 * Generates text from an audio input using Gemini's multimodal capabilities.
 * Used for voice-note transcription (YGG-97).
 *
 * @param audioBase64 - Base64-encoded audio data.
 * @param mimeType - MIME type of the audio (e.g. 'audio/webm', 'audio/mp4').
 * @param prompt - The text prompt to accompany the audio.
 * @param options - Optional configuration for the model.
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
    const generativeModel = getGenAI().getGenerativeModel({
      model: modelName,
      systemInstruction: options?.systemInstruction,
      generationConfig: {
        temperature: options?.temperature ?? 0.1, // Low temperature for faithful transcription
        maxOutputTokens: options?.maxOutputTokens,
        responseMimeType: options?.responseMimeType,
      },
    });

    const result = await generativeModel.generateContent([
      { inlineData: { data: audioBase64, mimeType } },
      { text: prompt },
    ]);
    const responseText = result.response.text();

    if (responseText) {
      return responseText;
    }

    throw new Error('Gemini API returned an empty response for audio input.');
  } catch (error) {
    logger.error('Error generating text from audio with Gemini:', error);
    if (error instanceof Error) {
      throw new Error(`GeminiAudioGenerationError: ${error.message}`);
    }
    throw new Error('GeminiAudioGenerationError: Unknown error occurred.');
  }
}
