'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A3C2E]">
        <div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="bg-primary text-white p-4">
        <ul className="flex space-x-4">
          <li><Link href="/journal">Journal</Link></li>
          <li><Link href="/entries">Entries</Link></li>
          <li><Link href="/roots">Roots</Link></li>
          <li><Link href="/insights">Insights</Link></li>
          <li><Link href="/settings">Settings</Link></li>
        </ul>
      </nav>
      <main className="flex-grow p-4">
        {children}
      </main>
    </div>
  );
}
