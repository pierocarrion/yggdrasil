export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
export type JourneyStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: number;
  completedAt?: number;
  aiSuggested: boolean;
  sourceEntryId?: string;
}

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: number;
}

export interface Journey {
  id: string;
  userId: string;
  title: string;
  description: string;
  steps: JourneyStep[];
  status: JourneyStatus;
  startedAt: number;
  completedAt?: number;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: number;
  metadata: Record<string, unknown>;
}
