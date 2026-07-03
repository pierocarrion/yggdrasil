#!/usr/bin/env node
/**
 * Grant (or revoke) the `admin` custom claim that unlocks the ops dashboard.
 *
 * Usage:
 *   node scripts/set-admin-claim.mjs <email-or-uid>            # grant
 *   node scripts/set-admin-claim.mjs <email-or-uid> --revoke   # revoke
 *
 * Credentials come from the same env vars as lib/firebase/admin.ts:
 *   FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
 * or Application Default Credentials (gcloud auth application-default login).
 *
 * The user must sign out and back in (or refresh their ID token) for the claim
 * to take effect.
 */
import admin from 'firebase-admin';

const target = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!target) {
  console.error('Usage: node scripts/set-admin-claim.mjs <email-or-uid> [--revoke]');
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
} else if (projectId) {
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId });
} else {
  console.error('Missing FIREBASE_ADMIN_PROJECT_ID (and credentials). See .env.production.example.');
  process.exit(1);
}

const auth = admin.auth();

try {
  const user = target.includes('@')
    ? await auth.getUserByEmail(target)
    : await auth.getUser(target);

  const claims = { ...(user.customClaims ?? {}) };
  if (revoke) {
    delete claims.admin;
  } else {
    claims.admin = true;
  }

  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`${revoke ? 'Revoked' : 'Granted'} admin for ${user.email ?? user.uid} (uid: ${user.uid}).`);
  console.log('They must sign out and back in for the change to take effect.');
  process.exit(0);
} catch (error) {
  console.error('Failed to update admin claim:', error?.message ?? error);
  process.exit(1);
}
