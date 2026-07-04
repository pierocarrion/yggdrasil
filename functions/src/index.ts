import * as admin from 'firebase-admin';

// Initialize the Admin SDK once
admin.initializeApp();

export { analyzeEntry } from './gemini/analyzeEntry';
export { transcribeAudio } from './gemini/transcribeAudio';
export { computeHiddenConnections } from './insights/hiddenConnections';
export { yggiChat } from './yggi/chat';
export { onRootWrite } from './roots/onRootWrite';
export { generateBranchActions } from './roots/generateBranchActions';
export { generateWeeklyReport } from './reports/weeklyReport';
export { backfillEmbeddings } from './admin/backfillEmbeddings';
export { onUserCreate } from './auth/onUserCreate';
export { createCheckout } from './stripe/createCheckout';
export { createBillingPortalSession } from './stripe/createBillingPortalSession';
export { stripeWebhook } from './stripe/stripeWebhook';
