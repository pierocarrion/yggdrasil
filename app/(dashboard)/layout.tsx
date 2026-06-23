'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOut();
      router.replace('/login');
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-12 h-12 text-sage animate-pulse" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
          </svg>
          <span className="text-sm font-sans tracking-widest uppercase text-muted-foreground animate-pulse">
            Yggdrasil is thinking...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    {
      name: 'Journal',
      href: '/journal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      ),
    },
    {
      name: 'Entries',
      href: '/entries',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 0 1 4.5 10.125v-4.5C4.5 5.004 5.004 4.5 5.625 4.5Z" />
        </svg>
      ),
    },
    {
      name: 'Roots',
      href: '/roots',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
        </svg>
      ),
    },
    {
      name: 'Insights',
      href: '/insights',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-1.813-5.096L2.091 14.1l5.096-.813L9 8.192l.813 5.095 5.096.813-5.096 1.804zM19.071 4.929l-.354 1.06-.353-1.06-.354-.354 1.06-.353.354 1.06.353-1.06.354.354-1.06.353-.354-1.06z" />
        </svg>
      ),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .225c-.008.379.137.751.43.992l1.003.828a1.125 1.125 0 0 1-.26 1.43l-1.297 2.247a1.125 1.125 0 0 1-1.37.491l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.225c.007-.379-.138-.751-.43-.992l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-screen flex bg-background text-foreground font-sans overflow-hidden">
      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-[220px] bg-surface border-r border-border h-full shrink-0">
        {/* Wordmark and logo */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-border/40">
          <svg className="w-5.5 h-5.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
          </svg>
          <span className="font-display font-medium text-lg tracking-wider text-foreground select-none">
            YGGDRASIL
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 flex flex-col justify-between">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-muted/30 border-l-[3px] border-gold text-foreground pl-[9px]'
                        : 'text-foreground/60 hover:bg-surface-2 hover:text-foreground border-l-[3px] border-transparent'
                    }`}
                  >
                    <span className={isActive ? 'text-gold' : 'text-foreground/40'}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User profile footer info */}
          <div className="px-4 py-3 border-t border-border/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center text-xs font-mono font-medium text-sage uppercase border border-border">
              {user.email ? user.email.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate text-foreground/80">
                {user.email || 'User'}
              </span>
              <span className="text-[10px] text-sage tracking-wider uppercase font-medium">
                Explorer
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="ml-auto rounded-sm border border-border px-2 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header Bar */}
        <header className="md:hidden h-14 bg-surface border-b border-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c2.5 0 5 1.5 5 4s-2.5 4-5 4M12 9C9.5 9 7 10.5 7 13s2.5 4 5 4M12 5c4 0 6 2 6 5s-2 5-6 5M12 5c-4 0-6 2-6 5s2 5 6 5" />
            </svg>
            <span className="font-display font-medium text-base tracking-wider text-foreground">
              YGGDRASIL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-muted flex items-center justify-center text-xs font-mono text-sage border border-border">
              {user.email ? user.email.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="rounded-sm border border-border px-2 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 relative bg-background">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around z-40 px-2 shadow-lg">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center w-12 h-12 relative group"
              >
                <span className={`transition-colors duration-300 ${isActive ? 'text-gold' : 'text-foreground/40 group-hover:text-foreground/75'}`}>
                  {item.icon}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
