import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { generateEmbedding, geminiapikey } from '../lib/gemini';
import { FREE_ROOTS_LIMIT, type BillingPeriod, type SubscriptionStatus } from '../stripe/shared';

/**
 * Keeps a Root's embedding fresh and enforces the free-tier active-roots cap.
 *
 * The client sets embeddingStatus to 'pending' on create and whenever the
 * fields the embedding derives from (title / why / fruit) change; branch
 * status toggles leave it untouched, so this trigger stays quiet during
 * day-to-day use. The embedding lets the analysis pipeline match new journal
 * entries against the user's roots.
 */
export const onRootWrite = onDocumentWritten(
  {
    document: 'users/{userId}/roots/{rootId}',
    secrets: [geminiapikey],
  },
  async (event) => {
    const { userId, rootId } = event.params;
    const rootData = event.data?.after?.data();

    if (!rootData) {
      return; // deleted
    }

    if (rootData.embeddingStatus !== 'pending') {
      return;
    }

    const db = admin.firestore();
    const rootRef = db.doc(`users/${userId}/roots/${rootId}`);

    try {
      const embeddingSource = [rootData.title, rootData.why, rootData.fruit?.text]
        .filter(Boolean)
        .join('\n');

      const embeddingValues = await generateEmbedding(embeddingSource);

      // Free-tier cap: the oldest FREE_ROOTS_LIMIT active roots stay usable,
      // anything newer is gated (mirrors insightGated on entries). Deterministic
      // by createdAt so the same roots stay gated between runs.
      const subscriptionSnap = await db.doc(`subscriptions/${userId}`).get();
      const subscriptionData = subscriptionSnap.data() as {
        status?: SubscriptionStatus;
        billingPeriod?: BillingPeriod | null;
      } | undefined;
      const paid = (subscriptionData?.status ?? 'none') === 'active'
        && (subscriptionData?.billingPeriod ?? null) !== null;

      let gated = false;
      if (!paid && rootData.status === 'active') {
        const olderActiveSnap = await db.collection(`users/${userId}/roots`)
          .where('status', '==', 'active')
          .where('createdAt', '<', rootData.createdAt)
          .count()
          .get();
        gated = olderActiveSnap.data().count >= FREE_ROOTS_LIMIT;
      }

      await rootRef.update({
        embedding: admin.firestore.FieldValue.vector(embeddingValues),
        embeddingStatus: 'complete',
        embeddingGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        gated,
      });

      logger.info('[onRootWrite] Root embedding updated', { userId, rootId, gated });
    } catch (error) {
      logger.error('[onRootWrite] Failed to process root', { userId, rootId, error });
      await rootRef.update({ embeddingStatus: 'error' }).catch(() => {});
    }
  }
);
