import { VertexAI } from '@google-cloud/vertexai';

export const vertexAI = new VertexAI({
  project: process.env.VERTEX_AI_PROJECT || '',
  location: process.env.VERTEX_AI_LOCATION || '',
});
