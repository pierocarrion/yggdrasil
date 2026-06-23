const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'yggdrasil-497923',
});
const db = admin.firestore();

async function run() {
  const dummyVector = new Array(768).fill(0.1);
  const snapshot = await db.collection('users').doc('dummy_user').collection('entries')
    .findNearest('embedding', admin.firestore.FieldValue.vector(dummyVector), {
      limit: 5,
      distanceMeasure: 'COSINE'
    })
    .get();

  console.log('Query successful! Found docs:', snapshot.docs.length);
}

run().catch(e => console.error('Query failed:', e.message));
