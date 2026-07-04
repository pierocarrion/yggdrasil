import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { scoreRootCandidates, type RootCandidate } from './scoring';

function htmlToExcerpt(html: string, maxLength = 160): string {
  const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength - 3)}…` : plain;
}

/**
 * Called from analyzeEntry after analysis completes: matches the new entry
 * against the user's active roots and writes pending link suggestions the
 * user confirms or dismisses in the Roots UI. Doc IDs are `${rootId}_${entryId}`
 * so a dismissed pair can never resurface.
 */
export async function suggestRootLinksForEntry(
  userId: string,
  entryId: string,
  entryData: FirebaseFirestore.DocumentData,
  entryEmbedding: number[],
  themes: string[]
): Promise<void> {
  const db = admin.firestore();

  const rootsSnap = await db.collection(`users/${userId}/roots`)
    .where('status', '==', 'active')
    .limit(50)
    .get();

  const candidates: RootCandidate[] = rootsSnap.docs
    .filter((doc) => {
      const data = doc.data();
      return data.embedding && !data.gated;
    })
    .map((doc) => ({
      id: doc.id,
      title: doc.data().title ?? '',
      why: doc.data().why ?? '',
      embedding: doc.data().embedding.toVector(),
    }));

  if (candidates.length === 0) {
    return;
  }

  const alreadyLinked: string[] = entryData.linkedRootIds ?? [];
  const scored = scoreRootCandidates(entryEmbedding, themes, candidates)
    .filter((candidate) => !alreadyLinked.includes(candidate.rootId));

  if (scored.length === 0) {
    return;
  }

  const batch = db.batch();
  let written = 0;

  for (const candidate of scored) {
    const suggestionRef = db.doc(`users/${userId}/rootSuggestions/${candidate.rootId}_${entryId}`);
    const existing = await suggestionRef.get();
    if (existing.exists) {
      continue; // any prior status (incl. dismissed) is final for this pair
    }

    const root = candidates.find((c) => c.id === candidate.rootId);
    batch.set(suggestionRef, {
      userId,
      rootId: candidate.rootId,
      rootTitle: root?.title ?? '',
      entryId,
      ...(entryData.title ? { entryTitle: entryData.title } : {}),
      entryExcerpt: htmlToExcerpt(entryData.content ?? ''),
      entryDate: entryData.entryDate ?? entryData.createdAt?.toMillis?.() ?? Date.now(),
      similarity: candidate.score,
      status: 'pending',
      createdAt: Date.now(),
    });
    written++;
  }

  if (written > 0) {
    await batch.commit();
    logger.info('[suggestRootLinks] Wrote link suggestions', { userId, entryId, count: written });
  }
}
