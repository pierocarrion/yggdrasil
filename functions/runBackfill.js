const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

admin.initializeApp({
  projectId: 'yggdrasil-497923',
});
const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-exp' });
  const snapshot = await db.collectionGroup('entries').get();
  
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const text = data.content || data.title || '';
    if (!text) continue;

    try {
      const res = await model.embedContent(text);
      await doc.ref.update({
        embedding: admin.firestore.FieldValue.vector(res.embedding.values),
        embeddingGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
      console.log(`Updated ${doc.id}`);
    } catch(e) {
      console.error(`Error on ${doc.id}:`, e.message);
    }
  }
  console.log(`Finished updating ${count} entries with gemini-embedding-exp.`);
}
run().catch(console.error);
