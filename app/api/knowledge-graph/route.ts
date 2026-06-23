import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { buildKnowledgeGraph } from '@/lib/knowledgeGraph';
import type { JournalEntry, EntryAnalysis } from '@/types/journal';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const url = new URL(request.url);
    const tier = (url.searchParams.get('tier') as 'basic' | 'full') || 'basic';

    const entriesSnapshot = await adminDb.collection('users').doc(userId).collection('entries').get();
    
    const entries = await Promise.all(entriesSnapshot.docs.map(async doc => {
      const data = doc.data();
      
      // Fetch analysis from subcollection
      const analysisSnap = await adminDb.collection('users').doc(userId)
        .collection('entries').doc(doc.id)
        .collection('analysis').limit(1).get();
        
      const analysis = analysisSnap.empty ? undefined : analysisSnap.docs[0].data();

      return {
        ...data,
        id: doc.id,
        analysis
      } as (JournalEntry & { analysis?: EntryAnalysis });
    }));

    const graphData = buildKnowledgeGraph(entries, tier);

    return NextResponse.json(graphData);
  } catch (error) {
    console.error('Knowledge Graph API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
