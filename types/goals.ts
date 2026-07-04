export type RootKind = 'value' | 'goal';
export type RootStatus = 'active' | 'completed' | 'archived';
export type BranchStatus = 'not_started' | 'in_progress' | 'done';

export interface BranchAction {
  id: string; // client-generated (crypto.randomUUID())
  label: string; // ≤ 100 chars
  status: BranchStatus;
  source: 'manual' | 'ai';
  order: number;
  completedAt?: number;
}

// A milestone laid down around the trunk — a tree grows one ring per season.
export interface Ring {
  id: string;
  label: string;
  targetDate: number;
  achievedAt?: number;
}

export interface RootFruit {
  text: string; // ≤ 120 chars, measurable outcome
  completedAt?: number;
}

/**
 * A Root is a value or goal the user is growing — the foundation of the tree.
 * Values are ongoing practices (never "completed"); goals are achievable.
 * Each Root carries its own journey (the Trunk): a timeline of linked journal
 * entries and events stored in the `events` subcollection.
 */
export interface Root {
  id: string;
  userId: string;
  kind: RootKind;
  title: string;
  why: string; // "Root" section: why this matters, ≤ 140 chars
  rings: Ring[]; // usually 1 active; history kept
  branches: BranchAction[]; // this week's practices
  fruit: RootFruit | null;
  status: RootStatus;
  weekStartAt: number; // when branches were last reset
  winsThisWeek: number; // denormalized micro-win counter
  // Server-managed (rules-protected, mirrors insightGated on entries):
  gated?: boolean; // true when over the free-tier active-roots cap
  embeddingStatus?: 'pending' | 'complete' | 'error';
  embedding?: any; // FirebaseFirestore.VectorValue (any for cross-platform compatibility)
  embeddingGeneratedAt?: any; // FirebaseFirestore.Timestamp
  createdAt: number;
  updatedAt?: number;
  completedAt?: number; // kind === 'goal' only
}

export type JourneyEventType =
  | 'entry_linked'
  | 'micro_win'
  | 'week_reset'
  | 'ring_achieved'
  | 'fruit_completed';

/**
 * An immutable fact on a Root's journey timeline (the Trunk).
 * Stored at users/{uid}/roots/{rootId}/events.
 */
export interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  createdAt: number;
  // entry_linked
  entryId?: string;
  entryTitle?: string;
  entryExcerpt?: string; // ~160 chars plain text
  entryDate?: number;
  linkSource?: 'suggestion' | 'manual';
  // micro_win
  branchId?: string;
  label?: string;
  // week_reset
  snapshot?: Array<{ label: string; status: BranchStatus }>;
  weekOf?: number;
  // ring_achieved
  ringId?: string;
}

/**
 * A server-generated suggestion to link a journal entry to a Root, produced by
 * the analysis pipeline from embedding similarity + theme overlap. Doc ID is
 * `${rootId}_${entryId}` so a dismissed pair can never be re-suggested.
 * Stored at users/{uid}/rootSuggestions.
 */
export interface RootLinkSuggestion {
  id: string;
  userId: string;
  rootId: string;
  rootTitle: string; // denormalized for rendering
  entryId: string;
  entryTitle?: string;
  entryExcerpt: string;
  entryDate: number;
  similarity: number;
  status: 'pending' | 'confirmed' | 'dismissed';
  createdAt: number;
  resolvedAt?: number;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: number;
  metadata: Record<string, unknown>;
}
