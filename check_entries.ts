import { adminDb } from './lib/firebase/admin';
(async () => {
  const users = await adminDb.collection('users').get();
  for (const user of users.docs) {
    const entries = await adminDb.collection(`users/${user.id}/entries`).get();
    console.log(`User ${user.id} has ${entries.size} entries.`);
    if (entries.size > 0) {
      const first = entries.docs[0].data();
      console.log('First entry fields:', Object.keys(first));
      console.log('entryDate value:', first.entryDate);
    }
  }
})();
