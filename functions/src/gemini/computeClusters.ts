import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

const STRONG_THRESHOLD = 0.78;
const MIN_CLUSTER_SIZE = 3;

export async function computeAndSaveClusters(userId: string) {
  try {
    const db = admin.firestore();

    logger.info(`[computeClusters] Starting cluster computation for user ${userId}`);

    // 1. Fetch all entry-to-entry edges for the user
    const edgesSnap = await db.collection(`users/${userId}/connections`).get();
    const edges = edgesSnap.docs.map(d => d.data());

    // 2. Filter for strong edges
    const strongEdges = edges.filter(e => !e.weak && e.similarity >= STRONG_THRESHOLD);

    // 3. Build adjacency list of entries
    const adjList = new Map<string, string[]>();
    for (const e of strongEdges) {
      if (!adjList.has(e.sourceId)) adjList.set(e.sourceId, []);
      if (!adjList.has(e.targetId)) adjList.set(e.targetId, []);
      adjList.get(e.sourceId)!.push(e.targetId);
      adjList.get(e.targetId)!.push(e.sourceId);
    }

    // 4. Find connected components (simple BFS)
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const nodeId of adjList.keys()) {
      if (!visited.has(nodeId)) {
        const comp: string[] = [];
        const queue = [nodeId];
        visited.add(nodeId);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          comp.push(curr);
          const currNeighbors = adjList.get(curr) || [];
          for (const neighbor of currNeighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
        components.push(comp);
      }
    }

    // 5. Fetch entry timestamps
    const entriesSnap = await db.collection(`users/${userId}/entries`).get();
    const entryTimestamps = new Map<string, number>();
    entriesSnap.docs.forEach(d => {
      const data = d.data();
      if (data.createdAt) {
        // Handle Firestore Timestamp or number
        const t = data.createdAt.toMillis ? data.createdAt.toMillis() : new Date(data.createdAt).getTime();
        entryTimestamps.set(d.id, t);
      }
    });

    // 6. Build valid clusters
    const clusters: Array<{
      id: string;
      entryIds: string[];
      entryCount: number;
      timeSpanStr: string;
    }> = [];

    let clusterIndex = 0;
    for (const comp of components) {
      if (comp.length >= MIN_CLUSTER_SIZE) {
        let minTime = Infinity;
        let maxTime = -Infinity;

        for (const eid of comp) {
          const t = entryTimestamps.get(eid);
          if (t) {
            if (t < minTime) minTime = t;
            if (t > maxTime) maxTime = t;
          }
        }

        let timeSpanStr = '1 day';
        if (minTime !== Infinity && maxTime !== -Infinity && minTime !== maxTime) {
          const diffMs = maxTime - minTime;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays >= 30) {
            const months = Math.round(diffDays / 30);
            timeSpanStr = `${months} month${months > 1 ? 's' : ''}`;
          } else if (diffDays >= 7) {
            const weeks = Math.round(diffDays / 7);
            timeSpanStr = `${weeks} week${weeks > 1 ? 's' : ''}`;
          } else {
            const days = Math.max(1, Math.round(diffDays));
            timeSpanStr = `${days} day${days > 1 ? 's' : ''}`;
          }
        }

        clusters.push({
          id: `cluster_${clusterIndex++}`,
          entryIds: comp,
          entryCount: comp.length,
          timeSpanStr
        });
      }
    }

    // 7. Persist to Firestore
    const metadataRef = db.doc(`users/${userId}/graphMetadata/clusters`);
    await metadataRef.set({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      clusters
    }, { merge: true });

    logger.info(`[computeClusters] Saved ${clusters.length} clusters for user ${userId}`);
  } catch (error) {
    logger.error(`[computeClusters] Failed to compute clusters for user ${userId}`, error);
  }
}
