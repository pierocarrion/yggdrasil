'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '@/lib/auth';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // New accounts flow through onboarding (welcome → seed → first insight).
  // Returning sign-ins go straight to the journal; the onboarding route itself
  // bounces anyone who has already completed it, so Google returners are safe.
  const successRedirect = mode === 'signup' ? '/onboarding' : '/journal';

  const handleGoogleAuth = async () => {
    if (loading) return;

    try {
      setErrorMsg('');
      setLoading(true);
      await signInWithGoogle();
      router.replace(successRedirect);
    } catch (err: unknown) {
      console.error('[AuthForm] Google auth error:', err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.replace(successRedirect);
    } catch (err: unknown) {
      console.error('[AuthForm] Email auth error:', err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full rounded-sm border border-border bg-input px-3.5 py-2.5 text-base text-foreground placeholder:text-foreground/30 outline-none transition-colors focus:border-sage/60 focus:ring-2 focus:ring-ring/60 disabled:opacity-50';

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col gap-5">
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-sm border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? 'Please wait…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3.5">
        <span className="h-px flex-1 bg-border/40" />
        <span className="text-[11px] uppercase tracking-widest text-foreground/40">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-border/40" />
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-sm border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-foreground/85"
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground/70" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground/70" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className={fieldClass}
            placeholder="••••••••"
          />
        </div>
        <PrimaryButton type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Begin'}
        </PrimaryButton>
      </form>
    </div>
  );
}
