import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiClient = genAI;

export async function generateContent(prompt: string, model: string = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash'): Promise<string> {
  const generativeModel = genAI.getGenerativeModel({ model });
  const result = await generativeModel.generateContent(prompt);
  return result.response.text();
}

export async function generateJSON<T>(prompt: string, model: string = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash'): Promise<T> {
  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  const result = await generativeModel.generateContent(prompt);
  const text = result.response.text();
  // Strip fences if any exist just in case
  const cleanedText = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleanedText) as T;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_EMBEDDING || 'gemini-embedding-exp' });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}
