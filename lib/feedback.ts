import {
  addDoc,
  collection,
  getCountFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export const ENTRY_FIVE_TRIGGER = 'entry_5' as const;
export type FeedbackTrigger = typeof ENTRY_FIVE_TRIGGER;

export const DISMISSAL_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const SUBMISSION_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

export interface FeedbackThrottleState {
  lastShownAt?: number;
  lastSubmittedAt?: number;
  seenTriggers: string[];
}

interface SubmitFeedbackInput {
  userId: string;
  score: number;
  comment?: string;
  trigger: FeedbackTrigger;
}

interface NormalizedFeedback {
  userId: string;
  score: number;
  comment?: string;
  trigger: FeedbackTrigger;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const EMPTY_THROTTLE_STATE: FeedbackThrottleState = {
  seenTriggers: [],
};

export function getFeedbackStorageKey(userId: string): string {
  return `ygg_nps_v1:${userId}`;
}

export function isValidNpsScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 10;
}

export function normalizeFeedback(input: SubmitFeedbackInput): NormalizedFeedback {
  if (!input.userId.trim()) {
    throw new Error('User ID is required to submit feedback.');
  }

  if (!isValidNpsScore(input.score)) {
    throw new Error('NPS score must be an integer from 0 to 10.');
  }

  const comment = input.comment?.trim();

  return {
    userId: input.userId,
    score: input.score,
    trigger: input.trigger,
    ...(comment ? { comment } : {}),
  };
}

function getBrowserStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function readFeedbackThrottleState(
  userId: string,
  storage?: StorageLike
): FeedbackThrottleState | null {
  const targetStorage = getBrowserStorage(storage);
  if (!targetStorage) return null;

  try {
    const rawState = targetStorage.getItem(getFeedbackStorageKey(userId));
    if (!rawState) return { ...EMPTY_THROTTLE_STATE };

    const parsed = JSON.parse(rawState) as Partial<FeedbackThrottleState>;

    return {
      ...(isValidTimestamp(parsed.lastShownAt)
        ? { lastShownAt: parsed.lastShownAt }
        : {}),
      ...(isValidTimestamp(parsed.lastSubmittedAt)
        ? { lastSubmittedAt: parsed.lastSubmittedAt }
        : {}),
      seenTriggers: Array.isArray(parsed.seenTriggers)
        ? parsed.seenTriggers.filter(
            (trigger): trigger is string => typeof trigger === 'string'
          )
        : [],
    };
  } catch {
    return { ...EMPTY_THROTTLE_STATE };
  }
}

function writeFeedbackThrottleState(
  userId: string,
  state: FeedbackThrottleState,
  storage?: StorageLike
): boolean {
  const targetStorage = getBrowserStorage(storage);
  if (!targetStorage) return false;

  try {
    targetStorage.setItem(getFeedbackStorageKey(userId), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function isFeedbackPromptEligible(
  state: FeedbackThrottleState,
  trigger: string,
  now = Date.now()
): boolean {
  if (state.seenTriggers.includes(trigger)) return false;

  if (
    state.lastSubmittedAt !== undefined &&
    now - state.lastSubmittedAt < SUBMISSION_COOLDOWN_MS
  ) {
    return false;
  }

  if (
    state.lastShownAt !== undefined &&
    now - state.lastShownAt < DISMISSAL_COOLDOWN_MS
  ) {
    return false;
  }

  return true;
}

export function canShowFeedbackPrompt(
  userId: string,
  trigger: string,
  now = Date.now(),
  storage?: StorageLike
): boolean {
  const state = readFeedbackThrottleState(userId, storage);
  return state ? isFeedbackPromptEligible(state, trigger, now) : false;
}

export function markFeedbackPromptShown(
  userId: string,
  trigger: string,
  now = Date.now(),
  storage?: StorageLike
): boolean {
  const state = readFeedbackThrottleState(userId, storage);
  if (!state) return false;

  return writeFeedbackThrottleState(
    userId,
    {
      ...state,
      lastShownAt: now,
      seenTriggers: Array.from(new Set([...state.seenTriggers, trigger])),
    },
    storage
  );
}

export function markFeedbackSubmitted(
  userId: string,
  now = Date.now(),
  storage?: StorageLike
): boolean {
  const state = readFeedbackThrottleState(userId, storage);
  if (!state) return false;

  return writeFeedbackThrottleState(
    userId,
    {
      ...state,
      lastSubmittedAt: now,
    },
    storage
  );
}

export async function isFifthJournalEntry(userId: string): Promise<boolean> {
  if (!userId) return false;

  const entriesRef = collection(db, `users/${userId}/entries`);
  const snapshot = await getCountFromServer(entriesRef);
  return snapshot.data().count === 5;
}

export async function submitFeedback(
  input: SubmitFeedbackInput
): Promise<string> {
  const normalized = normalizeFeedback(input);
  const feedbackRef = await addDoc(collection(db, 'feedback'), {
    ...normalized,
    createdAt: serverTimestamp(),
  });

  return feedbackRef.id;
}
