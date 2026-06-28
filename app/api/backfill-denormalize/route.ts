import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
    }

    const usersSnap = await adminAuth.listUsers(1000);
    let migratedCount = 0;

    for (const user of usersSnap.users) {
      const entriesSnap = await adminDb.collection(`users/${user.uid}/entries`).get();
      
      for (const entryDoc of entriesSnap.docs) {
        const entryData = entryDoc.data();
        
        // Skip if already migrated
        if (entryData.analysis) {
          continue;
        }

        const analysisSnap = await entryDoc.ref.collection('analysis').limit(1).get();
        if (!analysisSnap.empty) {
          const analysisData = analysisSnap.docs[0].data();
          await entryDoc.ref.update({
            analysis: analysisData
          });
          migratedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, migratedCount });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
