import { getWeekStart, isWeekStale, cycleBranchStatus } from './rootsLogic';
import {
  scoreRootCandidates,
  SUGGEST_THRESHOLD,
  THEME_BOOST,
  MAX_SUGGESTIONS_PER_ENTRY,
} from '../functions/src/roots/scoring';

describe('getWeekStart', () => {
  it('returns Monday 00:00 for a mid-week timestamp', () => {
    // Wednesday 2026-07-01 15:30 local
    const wednesday = new Date(2026, 6, 1, 15, 30).getTime();
    const weekStart = new Date(getWeekStart(wednesday));
    expect(weekStart.getDay()).toBe(1); // Monday
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
    expect(weekStart.getDate()).toBe(29); // Monday 2026-06-29
  });

  it('treats Sunday as the end of the week, not the start', () => {
    // Sunday 2026-07-05
    const sunday = new Date(2026, 6, 5, 10, 0).getTime();
    const weekStart = new Date(getWeekStart(sunday));
    expect(weekStart.getDay()).toBe(1);
    expect(weekStart.getDate()).toBe(29); // still Monday 2026-06-29
  });

  it('is idempotent for a Monday midnight input', () => {
    const monday = new Date(2026, 5, 29, 0, 0).getTime();
    expect(getWeekStart(monday)).toBe(monday);
  });
});

describe('isWeekStale', () => {
  const wednesday = new Date(2026, 6, 1, 12, 0).getTime();

  it('is fresh when weekStartAt is within the current week', () => {
    expect(isWeekStale({ weekStartAt: getWeekStart(wednesday) }, wednesday)).toBe(false);
  });

  it('is stale when weekStartAt belongs to a previous week', () => {
    const lastWeek = getWeekStart(wednesday) - 7 * 24 * 60 * 60 * 1000;
    expect(isWeekStale({ weekStartAt: lastWeek }, wednesday)).toBe(true);
  });
});

describe('cycleBranchStatus', () => {
  it('cycles not_started → in_progress → done → not_started', () => {
    expect(cycleBranchStatus('not_started')).toBe('in_progress');
    expect(cycleBranchStatus('in_progress')).toBe('done');
    expect(cycleBranchStatus('done')).toBe('not_started');
  });
});

describe('scoreRootCandidates', () => {
  const root = (id: string, title: string, why: string, embedding: number[]) => ({
    id,
    title,
    why,
    embedding,
  });

  it('suggests a root whose embedding is similar enough', () => {
    const scored = scoreRootCandidates([1, 0], [], [root('a', 'Seclusion', '', [1, 0.1])]);
    expect(scored).toHaveLength(1);
    expect(scored[0].rootId).toBe('a');
    expect(scored[0].score).toBeGreaterThanOrEqual(SUGGEST_THRESHOLD);
  });

  it('rejects dissimilar roots below the threshold', () => {
    const scored = scoreRootCandidates([1, 0], [], [root('a', 'Seclusion', '', [0, 1])]);
    expect(scored).toHaveLength(0);
  });

  it('boosts a borderline root when a theme appears in its text', () => {
    // Cosine ≈ 0.5 — below threshold without the boost
    const embedding = [1, Math.sqrt(3)];
    const candidate = root('a', 'Solitude practice', 'time alone to reflect', [1, 0]);
    expect(scoreRootCandidates([...embedding], [], [candidate])).toHaveLength(0);

    const boosted = scoreRootCandidates([...embedding], ['Solitude'], [candidate]);
    expect(boosted).toHaveLength(1);
    expect(boosted[0].score).toBeCloseTo(0.5 + THEME_BOOST, 5);
  });

  it('returns at most the top suggestions, highest score first', () => {
    const candidates = [
      root('low', 'A', '', [0.8, 0.6]),
      root('high', 'B', '', [1, 0.01]),
      root('mid', 'C', '', [0.9, 0.4]),
    ];
    const scored = scoreRootCandidates([1, 0], [], candidates);
    expect(scored).toHaveLength(MAX_SUGGESTIONS_PER_ENTRY);
    expect(scored[0].rootId).toBe('high');
    expect(scored[1].rootId).toBe('mid');
  });

  it('handles zero vectors without NaN', () => {
    const scored = scoreRootCandidates([0, 0], ['anything'], [root('a', 'T', 'w', [1, 0])]);
    expect(scored).toHaveLength(0);
  });
});
