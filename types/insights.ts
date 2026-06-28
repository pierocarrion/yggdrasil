export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  weak?: boolean;
  theme?: string;
  score: number; // 0–1
  reason: string;
  computedVia: 'cirq' | 'fallback_knn';
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
