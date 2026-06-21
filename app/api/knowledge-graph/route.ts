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
    
    const entries = entriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      } as (JournalEntry & { analysis?: EntryAnalysis });
    });

    const graphData = buildKnowledgeGraph(entries, tier);

    return NextResponse.json(graphData);
  } catch (error) {
    console.error('Knowledge Graph API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
