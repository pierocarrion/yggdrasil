import { VertexAI, type GenerateContentResponse } from '@google-cloud/vertexai';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'yggdrasil-yggi';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT, location: LOCATION });

/** Resolved-text getter that matches the @google/generative-ai SDK shape. */
function extractText(resp: GenerateContentResponse): string {
  const parts = resp.response?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) return '';
  return parts.map((p) => p.text ?? '').join('');
}

interface VertexAIGenerativeModel {
  generateContent(
    request: { contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> },
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

/** Thin compatibility wrapper that exposes the @google/generative-ai model
 * surface (text(), promptFeedback, candidates) backed by Vertex AI. */
function wrapModel(inner: { generateContent: (req: unknown) => Promise<GenerateContentResponse> }): VertexAIGenerativeModel {
  return {
    async generateContent(request, options) {
      const abort = new AbortController();
      const timer = options?.timeout ? setTimeout(() => abort.abort(), options.timeout) : undefined;
      try {
        const raw = await inner.generateContent(request);
        if (timer) clearTimeout(timer);
        const wrapped: VertexAIGenerativeResponse = {
          response: {
            text() {
              return extractText(raw);
            },
            promptFeedback: raw.response?.promptFeedback as { blockReason?: string } | undefined,
            candidates: (raw.response?.candidates as Array<{ finishReason?: string }> | undefined) ?? [],
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
      systemInstruction: opts.systemInstruction,
    });
    return wrapModel(inner);
  },
};

export const geminiClient = client;
export const generateContentByClient = client;

export async function generateContent(
  prompt: string,
  model: string = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash'
): Promise<string> {
  const m = client.getGenerativeModel({ model });
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text();
}

export async function generateJSON<T>(
  prompt: string,
  model: string = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash'
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
