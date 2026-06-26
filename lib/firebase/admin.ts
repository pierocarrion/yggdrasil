import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Explicit service account credentials (local dev or injected by Cloud Run secrets)
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else if (projectId) {
    // Cloud Run / GCE: use Application Default Credentials (ADC)
    // The service account identity is automatically provided by the runtime
    console.log('Firebase Admin: using Application Default Credentials (ADC)');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  } else {
    // Build-time or uninitialized environment — warn but do not crash the import
    console.warn('Firebase Admin: skipped initialization — no credentials available (build time?)');
  }
}

const isInitialized = admin.apps.length > 0;

// Throw at call-site to surface misconfiguration quickly rather than silently returning {}
const adminDb = isInitialized
  ? admin.firestore()
  : new Proxy({} as admin.firestore.Firestore, {
      get() {
        throw new Error('Firebase Admin Firestore is not initialized. Check environment variables.');
      },
    });

const adminAuth = isInitialized
  ? admin.auth()
  : new Proxy({} as admin.auth.Auth, {
      get() {
        throw new Error('Firebase Admin Auth is not initialized. Check environment variables.');
      },
    });

export { adminDb, adminAuth };
