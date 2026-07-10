'use client';

import React, { useEffect } from 'react';
import { FeatureGate } from '@/components/billing/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';
import { logYggiChatOpened } from '@/lib/analytics/client';
import { SacredGeometry } from '@/components/onboarding/SacredGeometry';

interface YggiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YggiDrawer({ isOpen, onClose }: YggiDrawerProps) {
  const subscription = useSubscription();
  const isBlocked = subscription.entitlement !== 'PRO';

  useEffect(() => {
    if (isOpen) {
      logYggiChatOpened();
    }
  }, [isOpen]);

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-background/60 backdrop-blur-xs transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[440px] h-full
          bg-surface border-l border-border/80 shadow-2xl shadow-black/50
          transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        aria-label="Yggi chat companion"
      >
        {/* Header */}
        <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between shrink-0 bg-surface-2/30">
          <div className="flex items-center gap-2.5">
            <SacredGeometry size={22} breathe={isOpen} strokeWidth={1.5} />
            <h2 className="font-display text-xl tracking-wide text-foreground">Yggi</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-sm border border-transparent text-foreground/50 transition-all duration-300 hover:text-foreground hover:bg-muted/30 hover:border-border/30 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <FeatureGate
            blocked={isBlocked}
            requiredTier="PRO"
            label="Chatting with Yggi requires Pro access."
          >
            {/* Pro Companion Chat Shell Placeholder */}
            <div className="flex-1 flex flex-col justify-between h-full">
              {/* Message History Container */}
              <div className="flex-1 flex flex-col justify-center items-center text-center max-w-sm mx-auto space-y-4">
                <SacredGeometry size={64} breathe={true} opacity={0.8} />
                <div>
                  <h3 className="font-display text-lg text-foreground/90">Yggi Companion</h3>
                  <p className="mt-2 text-sm italic font-display text-gold/80 leading-relaxed">
                    {"\"When you're ready, I'll watch for how this evolves.\""}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    This is the shell for your semantic journaling companion. Soon, Yggi will have full memory of your journal history to reflect patterns, answer questions, and guide your growth.
                  </p>
                </div>
              </div>

              {/* Chat Input Placeholder */}
              <div className="mt-6 pt-4 border-t border-border/40 shrink-0">
                <div className="relative rounded-sm border border-border bg-surface-2/40 px-3.5 py-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Chat is coming soon..."
                    className="flex-1 bg-transparent text-sm text-foreground/50 outline-none placeholder:text-foreground/30 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled
                    aria-label="Send message"
                    className="p-1 rounded-sm text-gold/30 bg-gold/5 cursor-not-allowed border border-gold/10"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </FeatureGate>
        </div>
      </aside>
    </>
  );
}
