import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase/client';
import type {
  BranchAction,
  BranchStatus,
  JourneyEvent,
  Ring,
  Root,
  RootKind,
  RootLinkSuggestion,
  RootStatus,
} from '@/types/goals';
import type { JournalEntry } from '@/types/journal';
import { getWeekStart, ROOT_WHY_MAX, ROOT_FRUIT_MAX, BRANCH_LABEL_MAX } from './rootsLogic';

export {
  getWeekStart,
  isWeekStale,
  cycleBranchStatus,
  ROOT_WHY_MAX,
  ROOT_FRUIT_MAX,
  BRANCH_LABEL_MAX,
} from './rootsLogic';

const rootPath = (userId: string, rootId: string) => `users/${userId}/roots/${rootId}`;
const eventsPath = (userId: string, rootId: string) => `users/${userId}/roots/${rootId}/events`;

export interface CreateRootPayload {
  userId: string;
  kind: RootKind;
  title: string;
  why?: string;
  fruitText?: string;
  ring?: { label: string; targetDate: number };
}

export async function createRoot(payload: CreateRootPayload): Promise<string> {
  const { userId, kind, title, why, fruitText, ring } = payload;

  if (!userId) throw new Error('User ID is required to create a root.');
  if (!title.trim()) throw new Error('A root needs a name.');

  const rootRef = doc(collection(db, `users/${userId}/roots`));
  const batch = writeBatch(db);

  batch.set(rootRef, {
    userId,
    kind,
    title: title.trim(),
    why: why?.trim().slice(0, ROOT_WHY_MAX) ?? '',
    rings: ring
      ? [{ id: crypto.randomUUID(), label: ring.label.trim(), targetDate: ring.targetDate }]
      : [],
    branches: [],
    fruit: fruitText?.trim() ? { text: fruitText.trim().slice(0, ROOT_FRUIT_MAX) } : null,
    status: 'active' satisfies RootStatus,
    weekStartAt: getWeekStart(),
    winsThisWeek: 0,
    embeddingStatus: 'pending',
    createdAt: Date.now(),
  });

  await batch.commit();
  return rootRef.id;
}

/** Edits to the fields the root embedding is derived from re-queue embedding. */
export async function updateRootCore(
  userId: string,
  rootId: string,
  updates: { title?: string; why?: string; fruitText?: string | null; kind?: RootKind }
): Promise<void> {
  const batch = writeBatch(db);
  const data: Record<string, unknown> = {
    updatedAt: Date.now(),
    embeddingStatus: 'pending',
  };

  if (updates.title !== undefined) data.title = updates.title.trim();
  if (updates.why !== undefined) data.why = updates.why.trim().slice(0, ROOT_WHY_MAX);
  if (updates.kind !== undefined) data.kind = updates.kind;
  if (updates.fruitText !== undefined) {
    data.fruit = updates.fruitText?.trim()
      ? { text: updates.fruitText.trim().slice(0, ROOT_FRUIT_MAX) }
      : null;
  }

  batch.update(doc(db, rootPath(userId, rootId)), data);
  await batch.commit();
}

export async function setRootStatus(userId: string, rootId: string, status: RootStatus): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, rootPath(userId, rootId)), {
    status,
    updatedAt: Date.now(),
    ...(status === 'completed' ? { completedAt: Date.now() } : {}),
  });
  await batch.commit();
}

export async function addRing(
  userId: string,
  rootId: string,
  ring: { label: string; targetDate: number }
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, rootPath(userId, rootId)), {
    rings: arrayUnion({ id: crypto.randomUUID(), label: ring.label.trim(), targetDate: ring.targetDate }),
    updatedAt: Date.now(),
  });
  await batch.commit();
}

export async function achieveRing(userId: string, root: Root, ringId: string): Promise<void> {
  const ring = root.rings.find((r) => r.id === ringId);
  if (!ring || ring.achievedAt) return;

  const now = Date.now();
  const rings: Ring[] = root.rings.map((r) => (r.id === ringId ? { ...r, achievedAt: now } : r));

  const batch = writeBatch(db);
  batch.update(doc(db, rootPath(userId, root.id)), { rings, updatedAt: now });
  batch.set(doc(collection(db, eventsPath(userId, root.id))), {
    type: 'ring_achieved',
    ringId,
    label: ring.label,
    createdAt: now,
  });
  await batch.commit();
}

export async function addBranch(
  userId: string,
  root: Root,
  label: string,
  source: BranchAction['source'] = 'manual'
): Promise<void> {
  const branch: BranchAction = {
    id: crypto.randomUUID(),
    label: label.trim().slice(0, BRANCH_LABEL_MAX),
    status: 'not_started',
    source,
    order: root.branches.length,
  };
  const batch = writeBatch(db);
  batch.update(doc(db, rootPath(userId, root.id)), {
    branches: arrayUnion(branch),
    updatedAt: Date.now(),
  });
  await batch.commit();
}

export async function removeBranch(userId: string, root: Root, branchId: string): Promise<void> {
  const branches = root.branches.filter((b) => b.id !== branchId);
  const batch = writeBatch(db);
  batch.update(doc(db, rootPath(userId, root.id)), { branches, updatedAt: Date.now() });
  await batch.commit();
}

/**
 * Cycles or sets a branch status. Completing a branch IS a micro-win: it
 * writes a micro_win journey event and bumps the wins counter; undoing a
 * completion reverses both.
 */
export async function setBranchStatus(
  userId: string,
  root: Root,
  branchId: string,
  status: BranchStatus
): Promise<void> {
  const branch = root.branches.find((b) => b.id === branchId);
  if (!branch || branch.status === status) return;

  const now = Date.now();
  const wasDone = branch.status === 'done';
  const isDone = status === 'done';
  // Firestore rejects undefined inside arrays, so completedAt is added or
  // stripped rather than set to undefined.
  const branches = root.branches.map((b) => {
    if (b.id !== branchId) return b;
    const { completedAt: _completedAt, ...rest } = b;
    return isDone ? { ...rest, status, completedAt: now } : { ...rest, status };
  });

  const batch = writeBatch(db);
  const rootRef = doc(db, rootPath(userId, root.id));

  if (isDone && !wasDone) {
    batch.update(rootRef, { branches, winsThisWeek: root.winsThisWeek + 1, updatedAt: now });
    batch.set(doc(collection(db, eventsPath(userId, root.id))), {
      type: 'micro_win',
      branchId,
      label: branch.label,
      createdAt: now,
    });
  } else if (wasDone && !isDone) {
    batch.update(rootRef, { branches, winsThisWeek: Math.max(0, root.winsThisWeek - 1), updatedAt: now });
    // Remove the matching micro-win so the trunk stays honest. Sorted client-
    // side to avoid needing a composite index on the events subcollection.
    const winsSnap = await getDocs(
      query(
        collection(db, eventsPath(userId, root.id)),
        where('type', '==', 'micro_win'),
        where('branchId', '==', branchId)
      )
    );
    const newest = winsSnap.docs
      .sort((a, b) => (b.data().createdAt ?? 0) - (a.data().createdAt ?? 0))[0];
    if (newest) batch.delete(newest.ref);
  } else {
    batch.update(rootRef, { branches, updatedAt: now });
  }

  await batch.commit();
}

/**
 * Snapshots this week's branch outcomes into a week_reset journey event, then
 * resets every branch to not_started and zeroes the wins counter.
 */
export async function startNewWeek(userId: string, root: Root): Promise<void> {
  const now = Date.now();
  const batch = writeBatch(db);

  if (root.branches.length > 0) {
    batch.set(doc(collection(db, eventsPath(userId, root.id))), {
      type: 'week_reset',
      snapshot: root.branches.map((b) => ({ label: b.label, status: b.status })),
      weekOf: root.weekStartAt,
      createdAt: now,
    });
  }

  batch.update(doc(db, rootPath(userId, root.id)), {
    branches: root.branches.map(({ completedAt: _completedAt, ...b }) => ({
      ...b,
      status: 'not_started' as BranchStatus,
    })),
    weekStartAt: getWeekStart(now),
    winsThisWeek: 0,
    updatedAt: now,
  });

  await batch.commit();
}

export async function completeFruit(userId: string, root: Root): Promise<void> {
  if (!root.fruit || root.fruit.completedAt) return;
  const now = Date.now();
  const batch = writeBatch(db);
  batch.update(doc(db, rootPath(userId, root.id)), {
    fruit: { ...root.fruit, completedAt: now },
    updatedAt: now,
  });
  batch.set(doc(collection(db, eventsPath(userId, root.id))), {
    type: 'fruit_completed',
    label: root.fruit.text,
    createdAt: now,
  });
  await batch.commit();
}

function entryExcerpt(entry: Pick<JournalEntry, 'content'>): string {
  const plain = entry.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
}

/** Links a journal entry into a Root's journey (the Trunk). */
export async function linkEntryToRoot(
  userId: string,
  rootId: string,
  entry: Pick<JournalEntry, 'id' | 'title' | 'content' | 'createdAt' | 'entryDate'>,
  source: 'suggestion' | 'manual'
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(collection(db, eventsPath(userId, rootId))), {
    type: 'entry_linked',
    entryId: entry.id,
    ...(entry.title ? { entryTitle: entry.title } : {}),
    entryExcerpt: entryExcerpt(entry),
    entryDate: entry.entryDate ?? entry.createdAt,
    linkSource: source,
    createdAt: Date.now(),
  });
  batch.update(doc(db, `users/${userId}/entries/${entry.id}`), {
    linkedRootIds: arrayUnion(rootId),
  });
  await batch.commit();
}

export async function unlinkEntryFromRoot(userId: string, rootId: string, entryId: string): Promise<void> {
  const batch = writeBatch(db);
  const eventsSnap = await getDocs(
    query(collection(db, eventsPath(userId, rootId)), where('entryId', '==', entryId), limit(5))
  );
  eventsSnap.forEach((docSnap) => batch.delete(docSnap.ref));
  batch.update(doc(db, `users/${userId}/entries/${entryId}`), {
    linkedRootIds: arrayRemove(rootId),
  });
  await batch.commit();
}

export async function confirmSuggestion(
  userId: string,
  suggestion: RootLinkSuggestion
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(collection(db, eventsPath(userId, suggestion.rootId))), {
    type: 'entry_linked',
    entryId: suggestion.entryId,
    ...(suggestion.entryTitle ? { entryTitle: suggestion.entryTitle } : {}),
    entryExcerpt: suggestion.entryExcerpt,
    entryDate: suggestion.entryDate,
    linkSource: 'suggestion',
    createdAt: Date.now(),
  });
  batch.update(doc(db, `users/${userId}/entries/${suggestion.entryId}`), {
    linkedRootIds: arrayUnion(suggestion.rootId),
  });
  batch.update(doc(db, `users/${userId}/rootSuggestions/${suggestion.id}`), {
    status: 'confirmed',
    resolvedAt: Date.now(),
  });
  await batch.commit();
}

export async function dismissSuggestion(userId: string, suggestionId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, `users/${userId}/rootSuggestions/${suggestionId}`), {
    status: 'dismissed',
    resolvedAt: Date.now(),
  });
  await batch.commit();
}

export type { JourneyEvent };
