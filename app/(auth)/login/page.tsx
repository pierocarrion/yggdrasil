'use client';

import { AuthForm } from '@/components/auth/AuthForm';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/marketing/Logo';
import { GeometryBackdrop } from '@/components/onboarding/SacredGeometry';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.replace('/journal');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-dvh items-center justify-center bg-background text-sm uppercase tracking-widest text-muted-foreground">
        Yggi is here…
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-7 bg-background px-4 py-12 text-foreground">
      <GeometryBackdrop size={640} opacity={0.14} />

      <div className="relative flex flex-col items-center gap-2.5 text-center">
        <Logo size={44} />
        <h1 className="mt-4 font-display text-3xl font-light leading-tight sm:text-4xl">Welcome back to Yggdrasil</h1>
        <p className="text-sm text-foreground/55">
          New here?{' '}
          <Link href="/signup" className="text-sage transition-colors hover:text-sage/80">
            Plant your first seed
          </Link>
        </p>
      </div>

      <div className="relative w-full max-w-[400px]">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
