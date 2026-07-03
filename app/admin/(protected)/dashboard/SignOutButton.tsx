'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';

export function AdminSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
      await signOut().catch(() => {});
      router.replace('/admin/login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
