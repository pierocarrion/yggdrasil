import * as admin from 'firebase-admin';

// Initialize the Admin SDK once
admin.initializeApp();

export { analyzeEntry } from './gemini/analyzeEntry';
export { computeHiddenConnections } from './insights/hiddenConnections';
export { yggiChat } from './yggi/chat';
export { generateWeeklyReport } from './reports/weeklyReport';
