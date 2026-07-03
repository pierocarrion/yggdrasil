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
    const tierParam = url.searchParams.get('tier');
    const tier: 'basic' | 'full' = tierParam === 'full' ? 'full' : 'basic';

    const entriesSnapshot = await adminDb.collection('users').doc(userId).collection('entries').get();
    
    const entries = entriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        analysis: data.analysis
      } as (JournalEntry & { analysis?: EntryAnalysis });
    });

    // Fetch pre-computed backend clusters
    const clustersSnap = await adminDb.collection('users').doc(userId).collection('graphMetadata').doc('clusters').get();
    const backendClusters = clustersSnap.exists ? clustersSnap.data()?.clusters || [] : [];

    const graphData = buildKnowledgeGraph(entries, tier, backendClusters);

    // graphData is created from scratch as POJOs, no need for Timestamp checking which can throw
    return NextResponse.json(graphData);
  } catch (error) {
    // Auth failures (bad/expired token) are the client's fault → 401, not 500.
    const code = (error as { code?: string })?.code ?? '';
    if (code.startsWith('auth/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Log the full error server-side; never return stack traces or internal
    // paths to the caller.
    console.error('Knowledge Graph API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
