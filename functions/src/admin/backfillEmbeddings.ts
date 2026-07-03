import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { geminiapikey, generateEmbedding } from '../lib/gemini';

export const backfillEmbeddings = onRequest(
  {
    secrets: [geminiapikey],
  },
  async (req, res) => {
  // v2 HTTP functions are publicly invokable by default, so guard explicitly:
  // require a Firebase ID token belonging to a user with the `admin` custom
  // claim. Do NOT rely on the URL being secret.
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).send('Unauthorized: missing bearer token.');
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice('Bearer '.length));
    if (decoded.admin !== true) {
      res.status(403).send('Forbidden: admin claim required.');
      return;
    }
  } catch {
    res.status(401).send('Unauthorized: invalid token.');
    return;
  }

  try {
    const db = admin.firestore();
    const batchSize = 20;

    const entriesSnapshot = await db.collectionGroup('entries')
      .get();
      
    // Filter docs missing the embedding field
    const docsToProcess = entriesSnapshot.docs.filter(doc => !doc.data().embedding);

    if (docsToProcess.length === 0) {
      res.status(200).send('No entries need backfilling.');
      return;
    }

    let processedCount = 0;

    for (let i = 0; i < docsToProcess.length; i += batchSize) {
      const batchDocs = docsToProcess.slice(i, i + batchSize);
      const batch = db.batch();

      const promises = batchDocs.map(async (doc) => {
        const content = doc.data().content || doc.data().title || '';
        if (!content) return;

        try {
          const embeddingValues = await generateEmbedding(content);

          batch.update(doc.ref, {
            embedding: admin.firestore.FieldValue.vector(embeddingValues),
            embeddingGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
            embeddingError: admin.firestore.FieldValue.delete()
          });
        } catch (e) {
          logger.error('Error generating embedding in backfill', e);
        }
      });

      await Promise.all(promises);
      await batch.commit();
      
      processedCount += batchDocs.length;
      logger.info(`Processed ${processedCount}/${docsToProcess.length} entries`);
    }

    res.status(200).send(`Successfully backfilled ${processedCount} entries.`);
  } catch (error) {
    logger.error('Failed to backfill embeddings', error);
    res.status(500).send('Internal Server Error');
  }
  }
);
