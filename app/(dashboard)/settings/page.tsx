'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useFirestoreDoc } from '@/hooks/useFirestore';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { SettingsTracker } from './_tracker';

const ALL_FRAMEWORKS = [
  'Theravada Buddhist', 'Freudian', 'Jungian', 'Hermetic',
  'Advaita Vedanta', 'Taoist', 'Attachment Theory', 'IFS',
  'CBT', 'DBT', 'Stoic', 'Gnostic',
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const prefsPath = user ? `users/${user.uid}/settings/preferences` : '';
  const { data: preferences, loading } = useFirestoreDoc<{ enabledFrameworks?: string[] }>(prefsPath);
  const enabledFrameworks = preferences?.enabledFrameworks ?? [];

  const toggleFramework = useCallback(async (framework: string) => {
    if (!user) return;
    
    const isEnabled = enabledFrameworks.includes(framework);
    const newFrameworks = isEnabled 
      ? enabledFrameworks.filter(f => f !== framework)
      : [...enabledFrameworks, framework];

    try {
      await setDoc(doc(db, prefsPath), {
        enabledFrameworks: newFrameworks
      }, { merge: true });
    } catch (err) {
      console.error('Failed to update frameworks:', err);
    }
  }, [user, enabledFrameworks, prefsPath]);

  const handleLogout = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOut();
      router.replace('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <SettingsTracker />
      <h1 className="text-3xl font-display text-foreground mb-8">Settings</h1>
      
      <section className="mb-12">
        <h2 className="text-xl font-display text-foreground mb-4">Analytical Frameworks</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Optionally enable specific psychological or philosophical lenses for your insights. By default, Yggdrasil uses a warm, non-clinical reflective tone. Enabling frameworks will explicitly adopt their specific terminology and focus.
        </p>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-surface-2 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_FRAMEWORKS.map(framework => {
              const checked = enabledFrameworks.includes(framework);
              return (
                <label 
                  key={framework} 
                  className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${
                    checked 
                      ? 'bg-gold/10 border-gold/30 text-gold' 
                      : 'bg-surface-2 border-border/40 text-muted-foreground hover:bg-surface-2/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleFramework(framework)}
                  />
                  <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                    checked ? 'bg-gold border-gold' : 'border-muted-foreground/50'
                  }`}>
                    {checked && (
                      <svg className="w-3.5 h-3.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`font-medium ${checked ? 'text-foreground' : 'text-foreground/80'}`}>
                    {framework}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>

      <section className="pt-8 border-t border-border/40">
        <h2 className="text-xl font-display text-foreground mb-4">Account</h2>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 border border-red-900/30 px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {signingOut ? 'Signing out...' : 'Log Out'}
        </button>
      </section>
    </div>
  );
}
