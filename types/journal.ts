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
  mood?: Mood;
  entryType?: EntryType;
  tags: string[];
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  embedding?: any; // FirebaseFirestore.VectorValue (using any for cross-platform compatibility)
  embeddingGeneratedAt?: any; // FirebaseFirestore.Timestamp
}

export interface Interpretation {
  main_insight: string;
  questions: string[];
  action_items: string[];
  patterns_identified: string[];
  growth_connection: string;
  frameworks_applied?: string[];
  depth_analysis?: string;
}

export interface EntryAnalysis {
  id?: string;
  entryId?: string;
  entities: string[];
  themes: string[];
  emotions: string[];
  keywords: string[];
  summary: string;
  safety_concerns: string;
  interpretation: Interpretation;
  chakra_tags?: string[];
  tarot_tags?: string[];
  sacred_geometry?: string[];
  archetype_tags?: string[];
}
