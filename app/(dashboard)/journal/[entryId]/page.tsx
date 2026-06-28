'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore, useFirestoreDoc } from '@/hooks/useFirestore';
import { useRouter } from 'next/navigation';
import { limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { deleteEntry } from '@/lib/entries';
import type { JournalEntry, EntryAnalysis } from '@/types/journal';
import { InsightCard } from '@/components/insights/InsightCard';
import { Composer } from '@/components/journal/Composer';
import { toast } from 'sonner';

interface EntryPageProps {
  params: Promise<{ entryId: string }>;
}

export default function EntryPage({ params }: EntryPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Use React.use to unwrap the Promise
  const resolvedParams = use(params);
  const entryId = resolvedParams.entryId;
  const [retrying, setRetrying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prevAnalysisStatus, setPrevAnalysisStatus] = useState<string | null>(null);

  const handleRetry = async () => {
    if (!user || !entryId) return;
    setRetrying(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}/entries/${entryId}`), {
        analysisStatus: 'pending',
        analysisError: null,
      });
    } catch (err) {
      console.error("Failed to retry analysis:", err);
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !entryId) return;
    if (!window.confirm("Are you sure you want to delete this entry? This cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      await deleteEntry(user.uid, entryId);
      toast.success("Entry deleted");
      router.push('/journal');
    } catch (err) {
      console.error("Failed to delete entry:", err);
      toast.error("Failed to delete entry");
      setIsDeleting(false);
    }
  };

  const entryPath = user ? `users/${user.uid}/entries/${entryId}` : '';
  const { data: entry, loading: entryLoading, error: entryError } = useFirestoreDoc<JournalEntry>(entryPath);

  // Only query the subcollection if the analysis isn't already stored inline on the entry document
  const shouldFetchSubcollection = entry && !entry.analysis && user;
  const analysisPath = shouldFetchSubcollection ? `users/${user.uid}/entries/${entryId}/analysis` : '';
  
  // Query analysis subcollection (fallback for older entries)
  const { data: analysisDocs, loading: analysisLoading } = useFirestore<EntryAnalysis>(
    analysisPath,
    limit(1)
  );

  const analysis = entry?.analysis || (analysisDocs && analysisDocs.length > 0 ? analysisDocs[0] : null);

  useEffect(() => {
    if (entryError) {
      console.error('Error fetching entry:', entryError);
    }
  }, [entryError]);

  useEffect(() => {
    if (entry) {
      if (prevAnalysisStatus === 'pending' && entry.analysisStatus === 'complete') {
        toast.success("Yggdrasil has finished analyzing your entry");
      }
      setPrevAnalysisStatus(entry.analysisStatus || null);
    }
  }, [entry?.analysisStatus, prevAnalysisStatus, entry]);

  if (!user) return null; // Let the auth layout handle redirect
  
  if (entryLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-pulse">
        <div className="h-4 bg-surface-2 rounded w-1/4 mb-8"></div>
        <div className="h-24 bg-surface-2 rounded mb-12"></div>
        <div className="h-64 bg-surface-2 rounded"></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl text-foreground font-display">Entry not found</h2>
        <button 
          onClick={() => router.push('/journal')}
          className="mt-4 text-gold hover:text-gold/80"
        >
          Return to Journal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/journal')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <span>←</span> Back to Journal
        </button>
        {!isEditing && (
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display text-foreground">Edit Entry</h2>
            <button 
              onClick={() => setIsEditing(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <Composer 
            initialEntry={entry} 
            onSave={() => setIsEditing(false)} 
          />
        </div>
      ) : (
        <>
          {/* Entry Content */}
          <article className="prose prose-invert prose-p:text-foreground/90 prose-p:leading-relaxed max-w-none">
            <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
          <time dateTime={new Date(entry.entryDate || entry.createdAt).toISOString()} suppressHydrationWarning>
            {new Date(entry.entryDate || entry.createdAt).toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </time>
          {entry.entryType && (
            <>
              <span className="text-border">•</span>
              <span className="px-2 py-0.5 bg-surface-2 rounded text-xs">{entry.entryType}</span>
            </>
          )}
        </div>
        
        <div 
          className="text-lg whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
      </article>

      {/* Analysis Section */}
      <div className="pt-8 border-t border-border/40">
        <h2 className="text-lg font-display text-foreground mb-6">Reflection & Insight</h2>
        
        {entry.analysisStatus === 'pending' && (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-2/50 rounded-xl border border-border/40">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground italic font-display">Yggdrasil is thinking...</p>
          </div>
        )}

        {entry.analysisStatus === 'error' && (
          <div className="p-6 bg-red-900/10 border border-red-900/20 rounded-xl text-center">
            <p className="text-red-400 mb-2">There was an issue reflecting on this entry.</p>
            <button 
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 text-sm rounded transition-colors disabled:opacity-50"
            >
              {retrying ? 'Retrying...' : 'Retry Analysis'}
            </button>
            {entry.analysisError && (
              <p className="text-xs text-red-400/80 mt-4 p-3 bg-red-900/20 rounded font-mono text-left overflow-x-auto whitespace-pre-wrap border border-red-900/30">
                {entry.analysisError}
              </p>
            )}
          </div>
        )}

        {entry.analysisStatus === 'complete' && analysis && (
          <InsightCard analysis={analysis} />
        )}
      </div>
        </>
      )}
    </div>
  );
}
