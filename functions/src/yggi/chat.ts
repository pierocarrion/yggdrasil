import { onCall } from 'firebase-functions/v2/https';

export const yggiChat = onCall(async (request) => {
  // Yggi RAG chat function stub
  return { success: true, reply: "I am Yggi." };
});
