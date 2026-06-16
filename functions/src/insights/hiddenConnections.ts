import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { logHiddenConnectionsComputed } from '../lib/analytics';
// import { VertexAI } from '@google-cloud/vertexai'; // Used in fallback

export const computeHiddenConnections = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { userId } = data;

  if (!userId || userId !== auth.uid) {
    throw new HttpsError('invalid-argument', 'Missing or invalid userId.');
  }

  let computationPath: 'cirq' | 'fallback_knn' = 'cirq';
  let connections: any[] = [];

  try {
    if (process.env.CIRQ_ENABLED !== 'true') {
      throw new Error('Cirq disabled');
    }
    // Attempt Cirq quantum-inspired graph analysis
    // This is a stub for the Cirq logic
    throw new Error('Cirq placeholder error to trigger fallback');
  } catch (error) {
    // Silently fallback to Firestore KNN cosine similarity
    computationPath = 'fallback_knn';
    logger.info('Cirq failed or disabled, falling back to Firestore KNN similarity');
    
    const db = admin.firestore();
    const entriesSnapshot = await db.collectionGroup('entries')
      .where('userId', '==', userId)
      .get();
      
    const entries = entriesSnapshot.docs
      .filter(doc => doc.data().embedding)
      .map(doc => ({
        id: doc.id,
        embedding: doc.data().embedding.toVector() // Firebase VectorValue.toVector() returns number[]
      }));

    const pairs: Array<{ entryIdA: string; entryIdB: string; score: number; reason: string }> = [];

    // For each entry, find its nearest neighbors among the user's own entries
    for (const entry of entries) {
      const vectorQuery = db
        .collectionGroup('entries')
        .where('userId', '==', userId)
        .findNearest({
          vectorField: 'embedding',
          queryVector: admin.firestore.FieldValue.vector(entry.embedding),
          limit: 4, // top 3 neighbors + self
          distanceMeasure: 'COSINE',
        });

      const snapshot = await vectorQuery.get();
      const vectorQueryResults = (snapshot as any).vectorQueryResults;

      snapshot.docs.forEach((doc) => {
        if (doc.id === entry.id) return; // skip self
        // Firestore returns distance, not similarity — convert: similarity = 1 - distance
        // Fallback to 1 if not available
        const distance = vectorQueryResults?.[doc.id]?.distance ?? 0;
        const score = 1 - distance;
        
        // Deduplicate pairs (A,B) and (B,A)
        const pairKey = [entry.id, doc.id].sort().join('_');
        if (!pairs.find((p) => [p.entryIdA, p.entryIdB].sort().join('_') === pairKey)) {
          pairs.push({ 
            entryIdA: entry.id, 
            entryIdB: doc.id, 
            score,
            reason: 'High semantic similarity'
          });
        }
      });
    }

    connections = pairs.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  try {
    const db = admin.firestore();
    const batch = db.batch();
    const connectionsRef = db.collection(`users/${userId}/connections`);

    for (const conn of connections) {
      const newConnRef = connectionsRef.doc();
      batch.set(newConnRef, {
        ...conn,
        computedVia: computationPath,
        computedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    await logHiddenConnectionsComputed(userId, computationPath, connections.length);

    logger.info('hidden_connections_computation fired', { userId, path: computationPath });

    return { success: true, path: computationPath, count: connections.length };
  } catch (error) {
    logger.error('Failed to compute hidden connections', error);
    throw new HttpsError('internal', 'Computation failed.');
  }
});
