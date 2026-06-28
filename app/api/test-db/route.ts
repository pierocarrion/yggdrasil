import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  const userId = '8j1UCFkpOLZ6EskTZIPGKkRcszw1';
  const entryId = 'VqEym5bcLo7kjCjW5EEt'; // one of the complete ones
  
  const analysisSnap = await adminDb.collection(`users/${userId}/entries/${entryId}/analysis`).get();
  
  return NextResponse.json({ 
    empty: analysisSnap.empty,
    docs: analysisSnap.docs.map(d => d.id),
    data: analysisSnap.docs.map(d => d.data())
  });
}
