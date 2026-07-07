'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreDoc } from '@/hooks/useFirestore';
import type { OnboardingProfile } from '@/lib/onboarding';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

/** Calm full-screen loader in Yggdrasil's voice — never a bare spinner. */
function OnboardingLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background text-foreground"
    >
      <svg className="ygg-breathe h-12 w-12 text-sage" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
      </svg>
      <span className="text-sm uppercase tracking-widest text-muted-foreground">Yggi is here…</span>
    </div>
  );
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Unauthenticated visitors can't onboard — send them to sign in.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Returning users skip onboarding entirely (XPE-ONBRD-01).
  const profilePath = user ? `users/${user.uid}` : '';
  const { data: profile, loading: profileLoading } = useFirestoreDoc<OnboardingProfile>(profilePath);

  useEffect(() => {
    if (user && !profileLoading && profile?.onboardingCompleted) {
      router.replace('/journal');
    }
  }, [user, profileLoading, profile?.onboardingCompleted, router]);

  if (authLoading || !user || profileLoading || profile?.onboardingCompleted) {
    return <OnboardingLoader />;
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <OnboardingFlow user={user} />
    </main>
  );
}
