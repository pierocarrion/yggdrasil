export interface Mood {
  polarity: number;
  intensity: number;
  derivedLabel: string;
}

export enum EntryType {
  REFLECTION = 'REFLECTION',
  GRATITUDE = 'GRATITUDE',
  DREAM = 'DREAM',
  EVENT = 'EVENT',
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string; // rich text string
  moodPolarity?: number;
  moodIntensity?: number;
  moodLabel?: string;
  entryType?: EntryType;
  tags: string[];
  wordCount: number;
  createdAt: number;
  entryDate?: number; // Narrative date of the entry
  updatedAt: number;
  analysisStatus?: 'pending' | 'complete' | 'error';
  analysisError?: string;
  analysis?: EntryAnalysis;
  insightGated?: boolean;
  embedding?: any; // FirebaseFirestore.VectorValue (using any for cross-platform compatibility)
  embeddingGeneratedAt?: any; // FirebaseFirestore.Timestamp
  voiceNoteUrl?: string; // Storage path to the original voice recording (YGG-97)
}

export interface AnalysisEntity {
  type: 'person' | 'place' | 'event' | 'concept';
  name: string;
}

export interface AnalysisEmotion {
  label: string;
  polarity: number; // 0–10; 5 = neutral; lower = negative, higher = positive
  intensity: number; // 0–10; 5 = moderate; lower = mild, higher = intense
}

export interface SafetyConcerns {
  flagged: boolean;
  concerns: string[]; // empty when flagged is false
}

export interface Interpretation {
  main_insight: string;
  questions: string[]; // 3–5 items
  action_items: string[];
  patterns_identified: string[];
  growth_connection: string;
  frameworks_applied?: string[]; // populated only when depthScore >= 3
  depth_analysis?: string; // populated only when depthScore >= 3
}

export interface EntryAnalysis {
  id?: string;
  entryId?: string;
  depthScore: number; // 1–11; phase 1 output; drives phase 2 depth
  // --- 13 analysis fields ---
  entities: AnalysisEntity[];
  themes: string[]; // up to 5
  emotions: AnalysisEmotion[];
  keywords: string[];
  summary: string; // 2–3 sentences
  safety_concerns: SafetyConcerns;
  interpretation: Interpretation;
  // --- optional fields gated by user Settings ---
  chakra_tags?: string[];
  tarot_tags?: string[];
  sacred_geometry?: string[];
  archetype_tags?: string[];
}
