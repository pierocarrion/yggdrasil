export enum Mood {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  NEUTRAL = 'NEUTRAL',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum EntryType {
  REFLECTION = 'REFLECTION',
  DREAM = 'DREAM',
  GRATITUDE = 'GRATITUDE',
  VENT = 'VENT',
  INTENTION = 'INTENTION',
  FREE_WRITE = 'FREE_WRITE',
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string; // rich text string
  mood: Mood;
  entryType: EntryType;
  tags: string[];
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface EntryAnalysis {
  id?: string;
  entryId?: string;
  themes: string[];
  emotions: string[];
  peopleMentioned: string[];
  sentimentScore: number;
  archetypes: string[];
  attachmentPatterns: string[];
  shadowElements: string[];
  growthEdges: string[];
  goalSuggestions: string[];
  keywords: string[];
  summary: string;
  spiritualInsights: string[];
  hiddenPatterns: string[];
}
