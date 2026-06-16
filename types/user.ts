export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  plan: 'FREE' | 'PRO' | 'ANNUAL' | 'LIFETIME';
  createdAt: number;
  streakDays: number;
  lastEntryAt: number;
  analyticsClientId?: string;
}
