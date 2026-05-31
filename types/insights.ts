export interface Connection {
  id: string;
  entryIdA: string;
  entryIdB: string;
  score: number; // 0–1
  reason: string;
  computedVia: 'cirq' | 'fallback_vertex';
  computedAt: number;
}

export interface InsightCluster {
  id: string;
  entryIds: string[];
  label: string;
  centroidTheme: string;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  weekStarting: number;
  generatedAt: number;
  summary: string;
  topThemes: string[];
  moodTrend: string;
  goalProgress: string;
  aiNarrative: string;
}
