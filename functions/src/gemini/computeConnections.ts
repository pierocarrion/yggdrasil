import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { findNearestEntries } from '../lib/vectorSearch';

// Similarity threshold for a "real" connection
const STRONG_THRESHOLD = 0.78;
// Minimum number of guaranteed connections per node
const MIN_EDGES = 2;
// Maximum number of fallback weak connections to add if minimum is not met
const MAX_WEAK_EDGES = 2;

export async function computeAndSaveEdges(
  userId: string,
  entryId: string,
  embedding: number[]
) {
  try {
    logger.info(`[computeConnections] Finding nearest neighbors for entry ${entryId}`);
    // Query enough neighbors to guarantee we find some even after filtering out the entry itself
    const neighbors = await findNearestEntries(userId, embedding, 15);

    // Filter out the entry itself and convert distance to similarity
    const candidates = neighbors
      .filter((n) => n.id !== entryId)
      .map((n) => ({
        id: n.id,
        similarity: Math.max(0, 1 - n.distance),
      }))
      // Sort by similarity descending (highest first)
      .sort((a, b) => b.similarity - a.similarity);

    const edgesToWrite: Array<{
      sourceId: string;
      targetId: string;
      similarity: number;
      weak: boolean;
    }> = [];

    // 1. Identify strong edges
    const strongCandidates = candidates.filter((c) => c.similarity >= STRONG_THRESHOLD);
    
    for (const c of strongCandidates) {
      const [sourceId, targetId] = [entryId, c.id].sort();
      edgesToWrite.push({
        sourceId,
        targetId,
        similarity: c.similarity,
        weak: false,
      });
    }

    // 2. Minimum-connection guarantee: fill with weak edges if necessary
    if (strongCandidates.length < MIN_EDGES) {
      const weakCandidates = candidates
        .filter((c) => c.similarity < STRONG_THRESHOLD)
        .slice(0, MAX_WEAK_EDGES);

      for (const c of weakCandidates) {
        const [sourceId, targetId] = [entryId, c.id].sort();
        edgesToWrite.push({
          sourceId,
          targetId,
          similarity: c.similarity,
          weak: true,
        });
      }
    }

    if (edgesToWrite.length === 0) {
      logger.info(`[computeConnections] No valid neighbors found for ${entryId}`);
      return;
    }

    const db = admin.firestore();
    const batch = db.batch();
    const connectionsRef = db.collection(`users/${userId}/connections`);

    for (const edge of edgesToWrite) {
      // Deterministic doc ID ensures idempotency. The same pair will overwrite the same doc.
      const docId = `${edge.sourceId}_${edge.targetId}`;
      const edgeDocRef = connectionsRef.doc(docId);

      batch.set(
        edgeDocRef,
        {
          userId,
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          similarity: edge.similarity,
          weak: edge.weak,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true } // Merge true ensures we don't accidentally overwrite external fields like computedVia if they exist
      );
    }

    await batch.commit();
    logger.info(`[computeConnections] Successfully saved ${edgesToWrite.length} edges for entry ${entryId}`);
  } catch (error) {
    logger.error(`[computeConnections] Failed to compute/save edges for entry ${entryId}`, error);
    // Don't throw. We swallow the error so that the main entry analysis pipeline does not crash.
  }
}
