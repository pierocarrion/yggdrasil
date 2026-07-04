/**
 * Pure entry↔root matching logic, kept dependency-free so it can be unit
 * tested from the repo-level jest harness.
 */

/**
 * Minimum boosted similarity for an entry↔root link suggestion. Root text
 * (a one-line goal) and entry text (a full journal entry) live in different
 * registers, so this sits well below the entry↔entry STRONG_THRESHOLD.
 */
export const SUGGEST_THRESHOLD = 0.55;

/** Flat boost when an analysis theme literally appears in the root's text. */
export const THEME_BOOST = 0.08;

/** At most this many suggestions per entry, to keep the nudge gentle. */
export const MAX_SUGGESTIONS_PER_ENTRY = 2;

export interface RootCandidate {
  id: string;
  title: string;
  why: string;
  embedding: number[];
}

export interface ScoredRoot {
  rootId: string;
  score: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Scores active roots against an entry's embedding + extracted themes. */
export function scoreRootCandidates(
  entryEmbedding: number[],
  themes: string[],
  roots: RootCandidate[]
): ScoredRoot[] {
  const lowerThemes = themes.map((t) => t.toLowerCase());

  return roots
    .map((root) => {
      let score = cosineSimilarity(entryEmbedding, root.embedding);
      const rootText = `${root.title} ${root.why}`.toLowerCase();
      if (lowerThemes.some((theme) => theme && rootText.includes(theme))) {
        score += THEME_BOOST;
      }
      return { rootId: root.id, score };
    })
    .filter((candidate) => candidate.score >= SUGGEST_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS_PER_ENTRY);
}
