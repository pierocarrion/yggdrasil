import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/client';

/**
 * Shape of the onboarding-related fields we keep on the user profile document
 * (`users/{uid}`). These are client-writable (they are not among the
 * server-protected fields in firestore.rules), and let returning users skip the
 * flow across devices — a localStorage flag would re-trigger onboarding on every
 * new browser (XPE-ONBRD-01: "Returning users skip onboarding").
 */
export interface OnboardingProfile {
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: unknown;
  /** How the user left the flow: finished the seed entry, or skipped it. */
  onboardingOutcome?: 'seeded' | 'skipped';
}

/**
 * Marks onboarding as finished on the user profile. Merges into `users/{uid}`
 * so it never clobbers other profile fields. Called when the user chooses a
 * path after their first insight (`seeded`) or opts to look around first
 * (`skipped`) — either way, they should not be sent back through onboarding.
 */
export async function markOnboardingComplete(
  uid: string,
  outcome: 'seeded' | 'skipped',
): Promise<void> {
  if (!uid) return;
  await setDoc(
    doc(db, `users/${uid}`),
    {
      onboardingCompleted: true,
      onboardingCompletedAt: serverTimestamp(),
      onboardingOutcome: outcome,
    },
    { merge: true },
  );
}
