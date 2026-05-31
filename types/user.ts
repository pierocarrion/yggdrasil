export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  plan: 'FREE' | 'PRO' | 'ANNUAL';
  createdAt: number;
  streakDays: number;
  lastEntryAt: number;
}
