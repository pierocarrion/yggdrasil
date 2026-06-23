import * as admin from 'firebase-admin';

export interface NearestEntryResult {
  id: string;
  distance: number;
  data: any;
}

/**
 * Finds the K nearest journal entries to a given query vector using Cosine distance.
 * 
 * @param userId The ID of the user whose entries are being searched.
 * @param queryVector The embedding vector to search against.
 * @param limit The maximum number of entries to return (K). Defaults to 5.
 * @returns An array of results containing the entry ID, document data, and the distance score.
 */
export async function findNearestEntries(
  userId: string,
  queryVector: number[],
  limit: number = 5
): Promise<NearestEntryResult[]> {
  const db = admin.firestore();
  
  const entriesRef = db.collection('users').doc(userId).collection('entries');
  
  // Perform a vector search on the 'embedding' field
  const snapshot = await entriesRef
    .findNearest('embedding', admin.firestore.FieldValue.vector(queryVector), {
      limit,
      distanceMeasure: 'COSINE',
      distanceResultField: 'vectorDistance',
    } as any)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      distance: data.vectorDistance ?? 0,
      data,
    };
  });
}
