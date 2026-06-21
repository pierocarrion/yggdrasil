import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { geminiapikey, generateEmbedding } from '../lib/gemini';

export const backfillEmbeddings = onRequest(
  {
    secrets: [geminiapikey],
  },
  async (req, res) => {
  // Simple auth for admin endpoints if needed, but for this migration script
  // we'll assume it's protected by Cloud IAM or meant to be run once manually.
  
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
