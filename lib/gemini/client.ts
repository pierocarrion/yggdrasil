/* eslint-disable @typescript-eslint/no-explicit-any */
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'yggdrasil-yggi';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT, location: LOCATION });

function extractText(resp: unknown): string {
  const r = resp as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = r.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) return '';
  return parts.map((p) => p.text ?? '').join('');
}

interface VertexAIGenerativeModel {
  generateContent(
    request: {
      contents: Array<{
        role: string;
        parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
      }>;
    },
    options?: { timeout?: number },
  ): Promise<VertexAIGenerativeResponse>;
}

interface VertexAIGenerativeResponse {
  response: {
    text(): string;
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{ finishReason?: string }>;
  };
}

function wrapModel(inner: any): VertexAIGenerativeModel {
  return {
    async generateContent(request, options) {
      const timer = options?.timeout ? setTimeout(() => { /* signal via thrown error */ }, options.timeout) : undefined;
      try {
        const raw = await inner.generateContent(request);
        if (timer) clearTimeout(timer);
        const wrapped: VertexAIGenerativeResponse = {
          response: {
            text() {
              return extractText(raw);
            },
            promptFeedback: (raw as { promptFeedback?: { blockReason?: string } }).promptFeedback,
            candidates: (raw as { candidates?: Array<{ finishReason?: string }> }).candidates ?? [],
          },
        };
        return wrapped;
      } catch (err) {
        if (timer) clearTimeout(timer);
        throw err;
      }
    },
  };
}

interface GeminiClient {
  getGenerativeModel(opts: {
    model: string;
    generationConfig?: Record<string, unknown>;
    systemInstruction?: { parts: Array<{ text: string }> };
  }): VertexAIGenerativeModel;
}

const client: GeminiClient = {
  getGenerativeModel(opts) {
    const inner = vertexAI.getGenerativeModel({
      model: opts.model,
      generationConfig: opts.generationConfig as never,
      systemInstruction: opts.systemInstruction
        ? { role: 'system', parts: opts.systemInstruction.parts }
        : undefined,
    });
    return wrapModel(inner);
  },
};

export const geminiClient = client;

export async function generateContent(
  prompt: string,
  model: string = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash',
): Promise<string> {
  const m = client.getGenerativeModel({ model });
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text();
}

export async function generateJSON<T>(
  prompt: string,
  model: string = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash',
): Promise<T> {
  const m = client.getGenerativeModel({
    model,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const text = result.response.text();
  const cleaned = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const inner = vertexAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL_EMBEDDING || 'gemini-embedding-001',
  });
  const resp = await inner.embedContent({
    contents: [{ role: 'user', parts: [{ text }] }],
  });
  const values = (resp as { embedding?: { values?: number[] } }).embedding?.values ?? [];
  return values.slice(0, 768);
}
