import { adminDb } from './lib/firebase/admin';
(async () => {
  const users = await adminDb.collection('users').get();
  let totalEntries = 0;
  let totalWithEntryDate = 0;
  for (const user of users.docs) {
    const entries = await adminDb.collection(`users/${user.id}/entries`).get();
    totalEntries += entries.size;
    entries.forEach(doc => {
      if (doc.data().entryDate) totalWithEntryDate++;
    });
  }
  console.log(`Total entries: ${totalEntries}`);
  console.log(`Total with entryDate: ${totalWithEntryDate}`);
})();
