import type { BranchStatus, Root } from '@/types/goals';

export const ROOT_WHY_MAX = 140;
export const ROOT_FRUIT_MAX = 120;
export const BRANCH_LABEL_MAX = 100;

/** Start of the current week (Monday 00:00 local time). */
export function getWeekStart(now: number = Date.now()): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sunday
  const daysSinceMonday = (day + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date.getTime();
}

/** Wins badge shows 0 once the tracked week has lapsed without a reset. */
export function isWeekStale(root: Pick<Root, 'weekStartAt'>, now: number = Date.now()): boolean {
  return root.weekStartAt < getWeekStart(now);
}

export function cycleBranchStatus(status: BranchStatus): BranchStatus {
  switch (status) {
    case 'not_started':
      return 'in_progress';
    case 'in_progress':
      return 'done';
    case 'done':
      return 'not_started';
  }
}
