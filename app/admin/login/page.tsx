'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithGoogle, signOut, getFriendlyAuthErrorMessage } from '@/lib/auth';

/**
 * Admin sign-in. Authenticates with Firebase like the rest of the app, then
 * exchanges a fresh ID token for a `__session` cookie via /api/auth/session.
 * The endpoint only issues the cookie to users carrying the `admin` claim, so a
 * normal user who signs in here gets a clear "not authorized" message and is
 * signed back out.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const establishSession = async (idToken: string) => {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (res.status === 403) {
      // Signed in fine, but not an admin. Don't leave them holding a session.
      await signOut().catch(() => {});
      throw new Error('This account does not have admin access.');
    }
    if (!res.ok) {
      throw new Error('Could not start an admin session. Try again.');
    }
  };

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmail(email, password);
      await establishSession(await cred.user.getIdToken());
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error && err.message.includes('admin') ? err.message : getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithGoogle();
      await establishSession(await cred.user.getIdToken());
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error && err.message.includes('admin') ? err.message : getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-surface-2 p-8 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80 mb-2">Admin</p>
          <h1 className="font-display text-2xl text-foreground">Ops sign-in</h1>
          <p className="mt-2 text-sm text-foreground/60">Restricted to accounts with admin access.</p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleEmail} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="you@example.com"
            aria-label="Email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="Password"
            aria-label="Password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-surface disabled:opacity-50"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
