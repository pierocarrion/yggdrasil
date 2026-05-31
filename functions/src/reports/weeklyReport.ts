import { onCall } from 'firebase-functions/v2/https';

export const generateWeeklyReport = onCall(async (request) => {
  // Weekly AI report stub
  return { success: true, report: "Weekly wisdom..." };
});
