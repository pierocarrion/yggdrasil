import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
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

  let computationPath: 'cirq' | 'fallback_vertex' = 'cirq';
  let connections: any[] = [];

  try {
    if (process.env.CIRQ_ENABLED !== 'true') {
      throw new Error('Cirq disabled');
    }
    // Attempt Cirq quantum-inspired graph analysis
    // This is a stub for the Cirq logic
    throw new Error('Cirq placeholder error to trigger fallback');
  } catch (error) {
    // Silently fallback to Vertex AI cosine similarity
    computationPath = 'fallback_vertex';
    logger.info('Cirq failed or disabled, falling back to Vertex AI cosine similarity');
    
    // Stub for Vertex AI cosine similarity logic
    connections = [
      {
        entryIdA: 'stub-entry-1',
        entryIdB: 'stub-entry-2',
        score: 0.85,
        reason: 'Similar themes of growth and transition',
      }
    ];
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

    logger.info('hidden_connections_computation fired', { userId, path: computationPath });

    return { success: true, path: computationPath, count: connections.length };
  } catch (error) {
    logger.error('Failed to compute hidden connections', error);
    throw new HttpsError('internal', 'Computation failed.');
  }
});
