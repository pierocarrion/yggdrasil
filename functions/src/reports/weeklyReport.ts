import { onCall } from 'firebase-functions/v2/https';
import { logWeeklyWisdomGenerated } from '../lib/analytics';

export const generateWeeklyReport = onCall(async (request) => {
  // Weekly AI report stub
  const weekId = new Date().toISOString().slice(0, 10);
  await logWeeklyWisdomGenerated(weekId);
  return { success: true, report: "Weekly wisdom..." };
});
