'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { limit, updateDoc, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase/client';
import { createEntry } from '@/lib/entries';
import { markOnboardingComplete } from '@/lib/onboarding';
import { useFirestore, useFirestoreDoc } from '@/hooks/useFirestore';
import type { EntryAnalysis, JournalEntry } from '@/types/journal';
import {
  logEntryCreated,
  logOnboardingStarted,
  logOnboardingCompleted,
  logSeedEntryAnalyzed,
} from '@/lib/analytics/client';
import { toast } from 'sonner';
import { WelcomeStep } from './WelcomeStep';
import { SeedPromptStep } from './SeedPromptStep';
import { AnalyzingStep } from './AnalyzingStep';
import { HoldingStep } from './HoldingStep';
import { RetryStep } from './RetryStep';
import { InsightRevealStep } from './InsightRevealStep';

type Step = 'welcome' | 'seed' | 'analyzing' | 'insight' | 'retry';

/** Swap to the calm holding screen once analysis has been pending this long (YGG-44). */
const HOLDING_THRESHOLD_MS = 60_000;

/** Turn the user's plain-text seed into the rich-text HTML the entry store expects. */
function textToHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escape(para.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function formatTimestamp(ms: number): string {
  const time = new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `Today · ${time}`;
}

interface OnboardingFlowProps {
  user: User;
}

/**
 * The Threshold-ritual onboarding (design turn 2): sign up → welcome → seed
 * prompt → the wait teaches the features → the insight arrives as Yggi's reply
 * → three paths into the app. Fully wired to the real backend:
 *  - the seed is a real entry (`createEntry`, analysisStatus 'pending');
 *  - the Cloud Function analyzes it; we watch the doc for pending→complete
 *    exactly like the entry page (inline `analysis` or the analysis subcollection);
 *  - the first insight renders from that analysis, then completes onboarding.
 */
export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [seedText, setSeedText] = useState('');
  const [seedTimestamp, setSeedTimestamp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [holdingActive, setHoldingActive] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Fire onboarding_started once, when the user first enters the flow.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      logOnboardingStarted();
    }
  }, []);

  // ── Watch the seed entry + its analysis (mirrors the entry page) ──────────
  const entryPath = entryId ? `users/${user.uid}/entries/${entryId}` : '';
  const { data: entry } = useFirestoreDoc<JournalEntry>(entryPath);

  const shouldFetchSubcollection = Boolean(entry && !entry.analysis && entryId);
  const analysisPath = shouldFetchSubcollection
    ? `users/${user.uid}/entries/${entryId}/analysis`
    : '';
  const { data: analysisDocs } = useFirestore<EntryAnalysis>(analysisPath, limit(1));

  const analysis: EntryAnalysis | null = useMemo(
    () => entry?.analysis ?? (analysisDocs.length > 0 ? analysisDocs[0] : null),
    [entry?.analysis, analysisDocs],
  );

  // onboarding_completed must fire exactly once, whichever way the user exits.
  const completedFiredRef = useRef(false);
  const completeOnce = useCallback(
    (outcome: 'seeded' | 'skipped') => {
      if (!completedFiredRef.current) {
        completedFiredRef.current = true;
        logOnboardingCompleted();
      }
      // Fire-and-forget: never block the user's exit on a profile write.
      void markOnboardingComplete(user.uid, outcome).catch((err) =>
        console.error('Failed to mark onboarding complete', err),
      );
    },
    [user.uid],
  );

  // ── Analysis outcome → insight or graceful retry ─────────────────────────
  useEffect(() => {
    if (step !== 'analyzing' || !entry) return;

    if (entry.analysisStatus === 'complete' && analysis) {
      logSeedEntryAnalyzed();
      completeOnce('seeded');
      setHoldingActive(false);
      setStep('insight');
    } else if (entry.analysisStatus === 'error') {
      setHoldingActive(false);
      setStep('retry');
    }
  }, [step, entry, analysis, completeOnce]);

  // ── 60s holding screen while still pending ───────────────────────────────
  useEffect(() => {
    if (step !== 'analyzing') return;
    const timer = setTimeout(() => setHoldingActive(true), HOLDING_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [step, entryId]);

  const beginAnalyzing = useCallback(() => {
    setHoldingActive(false);
    setStep('analyzing');
  }, []);

  const handlePlant = useCallback(
    async (text: string) => {
      if (!text.trim() || submitting) return;
      setSubmitting(true);
      try {
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        const id = await createEntry({
          userId: user.uid,
          content: textToHtml(text),
          wordCount,
          entryDate: Date.now(),
        });
        logEntryCreated({ has_mood: false, tag_count: 0, word_count: wordCount });
        setEntryId(id);
        setSeedText(text.trim());
        setSeedTimestamp(formatTimestamp(Date.now()));
        beginAnalyzing();
      } catch (err) {
        console.error('Failed to plant seed entry', err);
        toast.error('Yggi could not hold that just now. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, user.uid, beginAnalyzing],
  );

  const handleRetry = useCallback(async () => {
    if (!entryId || retrying) return;
    setRetrying(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}/entries/${entryId}`), {
        analysisStatus: 'pending',
        analysisError: null,
      });
      beginAnalyzing();
    } catch (err) {
      console.error('Failed to retry analysis', err);
      toast.error('Still tangled. Please try again in a moment.');
    } finally {
      setRetrying(false);
    }
  }, [entryId, retrying, user.uid, beginAnalyzing]);

  const leaveTo = useCallback(
    (route: string, outcome: 'seeded' | 'skipped') => {
      if (leaving) return;
      setLeaving(true);
      completeOnce(outcome);
      router.replace(route);
    },
    [leaving, completeOnce, router],
  );

  // The seed entry opened to its full insight (questions, depth, connections) —
  // where "continue into the app" lands once they've written something.
  const entryDetailPath = entryId ? `/journal/${entryId}` : '/journal';

  switch (step) {
    case 'welcome':
      return <WelcomeStep onBegin={() => setStep('seed')} />;

    case 'seed':
      return (
        <SeedPromptStep
          onPlant={handlePlant}
          onSkip={() => leaveTo('/journal', 'skipped')}
          submitting={submitting}
        />
      );

    case 'analyzing':
      return holdingActive ? (
        <HoldingStep onContinue={() => leaveTo(entryDetailPath, 'seeded')} />
      ) : (
        <AnalyzingStep />
      );

    case 'retry':
      return (
        <RetryStep
          entryText={seedText}
          timestamp={seedTimestamp}
          onRetry={handleRetry}
          onContinue={() => leaveTo(entryDetailPath, 'seeded')}
          retrying={retrying}
        />
      );

    case 'insight':
      return analysis ? (
        <InsightRevealStep
          analysis={analysis}
          entryPath={entryDetailPath}
          onChoose={(route) => leaveTo(route, 'seeded')}
          choosing={leaving}
        />
      ) : (
        <AnalyzingStep />
      );

    default:
      return null;
  }
}
