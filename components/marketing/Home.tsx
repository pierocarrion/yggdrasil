'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from './Logo';
import { Button } from './Button';
import { Input } from './Input';
import { PlanCard } from './PlanCard';
import { RootsCanvas } from './RootsCanvas';
import { FirefliesCanvas } from './FirefliesCanvas';
import { ComposerDemo } from './ComposerDemo';
import { GraphDemo } from './GraphDemo';

const STAGES = ['ROOTS', 'TRUNK', 'CANOPY', 'LIGHT'];

const FEATURES: { icon: ReactNode; title: string; body: string; delay: number }[] = [
  {
    delay: 0,
    title: 'Semantic understanding',
    body: "Yggdrasil reads between your lines, drawing out the people, themes, and quiet patterns you didn't know you'd written.",
    icon: (
      <path d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
    ),
  },
  {
    delay: 90,
    title: 'A living knowledge graph',
    body: 'Every entry becomes a node in a growing map of your inner life. What keeps returning becomes impossible to miss.',
    icon: (
      <path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    ),
  },
  {
    delay: 180,
    title: 'Reflective guidance',
    body: 'Gentle prompts drawn from philosophy, psychology, and old wisdom — never advice, always an invitation to look again.',
    icon: (
      <path d="M9.813 15.904 9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.904ZM18 5l.5 1.5L20 7l-1.5.5L18 9l-.5-1.5L16 7l1.5-.5L18 5Z" />
    ),
  },
  {
    delay: 0,
    title: 'Roots, trunk & leaves',
    body: 'Your values and goals form the roots; your habits and journeys, the trunk; every entry, a leaf. Yggdrasil keeps all three layers in view, so growth is tended — not guessed.',
    icon: (
      <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    ),
  },
  {
    delay: 90,
    title: 'Offline & always yours',
    body: 'Write anywhere. Your reflections sync when you return, so the practice never has to break.',
    icon: (
      <path d="M16.023 9.348h4.992V4.356m0 4.992-3.181-3.183a8.25 8.25 0 0 0-13.803 3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0 4.99v4.992m0-4.992h-4.992m4.992 0-3.181 3.183a8.25 8.25 0 0 1-13.803-3.7" />
    ),
  },
  {
    delay: 180,
    title: 'Private by nature',
    body: 'Honesty requires shelter. Your innermost thoughts stay yours — privacy sits at the root of everything we build.',
    icon: (
      <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    ),
  },
];

const TESTIMONIALS = [
  {
    delay: 0,
    quote: "It's the first journal that ever told me something I didn't already know about myself.",
    name: 'Maya R.',
    role: 'Beta member, 6 months',
  },
  {
    delay: 90,
    quote: 'Seeing my entries connect into a graph made a year of vague feelings suddenly legible.',
    name: 'Devin O.',
    role: 'Writer',
  },
  {
    delay: 180,
    quote: 'It feels less like an app and more like a quiet room I get to think in.',
    name: 'Priya S.',
    role: 'Therapist',
  },
];

function StageDivider({ label, subtitle, pad }: { label: string; subtitle: string; pad: string }) {
  return (
    <div data-reveal="0" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: pad }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--gold)',
          boxShadow: '0 0 10px rgba(201,168,76,0.4)',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.32em',
          color: 'rgba(201,168,76,0.8)',
          marginTop: 14,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 16,
          color: 'rgba(232,224,208,0.5)',
          marginTop: 8,
        }}
      >
        {subtitle}
      </span>
      <div
        data-stem
        style={{
          width: 1,
          height: 76,
          background: 'linear-gradient(180deg, rgba(201,168,76,0.45), rgba(201,168,76,0))',
          marginTop: 16,
          transformOrigin: 'top',
        }}
      />
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  lede,
  marginBottom = 56,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  marginBottom?: number;
}) {
  return (
    <div data-reveal="0" style={{ textAlign: 'center', maxWidth: 640, margin: `0 auto ${marginBottom}px` }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          color: 'rgba(201,168,76,0.8)',
          margin: '0 0 14px',
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: 'clamp(30px,4vw,44px)',
          lineHeight: 1.12,
          margin: 0,
          color: 'var(--foreground)',
        }}
      >
        {title}
      </h2>
      {lede && (
        <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(232,224,208,0.68)', margin: '16px auto 0' }}>{lede}</p>
      )}
    </div>
  );
}

export function MarketingHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [saving, setSaving] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const sapFillRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);
  const scrollRafRef = useRef(0);

  // Signed-in users go straight to the app (the old root redirect, gated by session).
  useEffect(() => {
    if (!loading && user) router.replace('/journal');
  }, [loading, user, router]);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reduced = reducedRef.current;
    const root = rootRef.current;

    /* ---------- scroll: nav chrome + sap spine ---------- */
    const handleScroll = () => {
      const y = window.scrollY;
      const nav = navRef.current;
      if (nav) {
        const on = y > 24;
        nav.style.background = on ? 'rgba(15,26,20,0.78)' : 'transparent';
        nav.style.backdropFilter = on ? 'blur(14px)' : 'none';
        nav.style.borderBottomColor = on ? 'rgba(42,64,53,0.4)' : 'transparent';
        nav.style.paddingTop = on ? '12px' : '20px';
        nav.style.paddingBottom = on ? '12px' : '20px';
      }
      /* Section-aligned progress: each stage maps to its section, not raw scroll fraction */
      const probe = y + window.innerHeight * 0.45;
      const tops = ['top', 'features', 'demos', 'begin'].map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + y : 0;
      });
      let p = 0;
      if (probe >= tops[3]) p = 1;
      else {
        for (let i = 2; i >= 0; i--) {
          if (probe >= tops[i]) {
            p = (i + (probe - tops[i]) / Math.max(1, tops[i + 1] - tops[i])) / 3;
            break;
          }
        }
      }
      if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) p = 1;
      if (sapFillRef.current) sapFillRef.current.style.height = (p * 99).toFixed(2) + '%';
      document.querySelectorAll<HTMLElement>('[data-stage]').forEach((row) => {
        const idx = parseInt(row.getAttribute('data-stage') || '0', 10);
        const passed = p >= idx / 3 - 0.01;
        const dot = row.querySelector<HTMLElement>('[data-stage-dot]');
        const label = row.querySelector<HTMLElement>('[data-stage-label]');
        if (dot) {
          dot.style.background = passed ? 'var(--gold)' : 'var(--background)';
          dot.style.boxShadow = passed ? '0 0 8px rgba(201,168,76,0.4)' : 'none';
        }
        if (label) label.style.color = passed ? 'rgba(201,168,76,0.85)' : 'rgba(232,224,208,0.35)';
      });
    };

    /* ---------- reveal system (scroll + rAF tweens) ---------- */
    let pending: HTMLElement[] = [];
    if (!reduced && root) {
      pending = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
      pending.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        const stem = el.querySelector<HTMLElement>('[data-stem]');
        if (stem) stem.style.transform = 'scaleY(0)';
      });
    }
    const tweenIn = (el: HTMLElement, delay: number) => {
      const start = performance.now() + delay;
      const dur = 800;
      const stem = el.querySelector<HTMLElement>('[data-stem]');
      const step = (now: number) => {
        const t = Math.max(0, Math.min(1, (now - start) / dur));
        const e = 1 - Math.pow(1 - t, 3);
        el.style.opacity = String(e);
        el.style.transform = 'translateY(' + (20 * (1 - e)).toFixed(2) + 'px)';
        if (stem) {
          const ts = Math.max(0, Math.min(1, (now - start - 250) / 700));
          stem.style.transform = 'scaleY(' + (1 - Math.pow(1 - ts, 3)).toFixed(3) + ')';
        }
        if (t < 1 || (stem && (now - start - 250) / 700 < 1)) requestAnimationFrame(step);
        else {
          el.style.opacity = '';
          el.style.transform = '';
          if (stem) stem.style.transform = '';
        }
      };
      requestAnimationFrame(step);
    };
    const checkReveals = () => {
      if (reduced) return;
      const vh = window.innerHeight;
      pending = pending.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) {
          tweenIn(el, parseInt(el.getAttribute('data-reveal') || '0', 10) || 0);
          return false;
        }
        return true;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    const revealTimer = setInterval(checkReveals, 350);
    checkReveals();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(revealTimer);
      cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  const goTo = (e: { preventDefault?: () => void } | undefined, id: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const target = el.getBoundingClientRect().top + window.scrollY - (id === 'top' ? 0 : 20);
    if (reducedRef.current) {
      window.scrollTo(0, target);
      return;
    }
    cancelAnimationFrame(scrollRafRef.current);
    const from = window.scrollY;
    const dist = target - from;
    const dur = Math.min(1100, 400 + Math.abs(dist) * 0.25);
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, from + dist * ease);
      if (t < 1) scrollRafRef.current = requestAnimationFrame(step);
    };
    scrollRafRef.current = requestAnimationFrame(step);
  };

  const billingBtnStyle = (active: boolean) =>
    ({
      padding: '8px 18px',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      background: active ? 'var(--gold-soft)' : 'transparent',
      color: active ? 'var(--gold)' : 'rgba(232,224,208,0.55)',
      boxShadow: active ? 'inset 0 0 0 1px var(--gold-line)' : 'none',
      transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
    }) as const;

  const goSignup = () => router.push('/signup');

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}
    >
      {/* ============ Fixed nav ============ */}
      <header
        ref={navRef}
        className="mkt-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingTop: 20,
          paddingBottom: 20,
          background: 'transparent',
          borderBottom: '1px solid transparent',
          transition: 'all 400ms var(--ease-gentle)',
        }}
      >
        <Logo size={22} showWordmark />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span className="mkt-nav-links">
            <a href="#features" onClick={(e) => goTo(e, 'features')} className="mkt-link">
              Features
            </a>
            <a href="#demos" onClick={(e) => goTo(e, 'demos')} className="mkt-link">
              The Practice
            </a>
            <a href="#pricing" onClick={(e) => goTo(e, 'pricing')} className="mkt-link">
              Pricing
            </a>
          </span>
          <Button size="sm" onClick={() => goTo(undefined, 'begin')}>
            Begin your practice
          </Button>
        </nav>
      </header>

      {/* ============ Sap spine (fixed scroll progress rail) ============ */}
      <div className="mkt-spine" style={{ position: 'fixed', left: 34, top: '50%', transform: 'translateY(-50%)', zIndex: 40 }}>
        <div style={{ position: 'relative', height: '42vh', width: 1, background: 'rgba(232,224,208,0.12)' }}>
          <div
            ref={sapFillRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1,
              height: '0%',
              background: 'linear-gradient(180deg, rgba(201,168,76,0.25), var(--gold))',
              boxShadow: '0 0 8px rgba(201,168,76,0.35)',
            }}
          />
          {STAGES.map((stage, i) => (
            <div
              key={stage}
              data-stage={i}
              style={{
                position: 'absolute',
                left: -3.5,
                top: `${i * 33}%`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                data-stage-dot
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: '1px solid rgba(201,168,76,0.5)',
                  background: 'var(--background)',
                  transition: 'background 500ms var(--ease-gentle)',
                }}
              />
              <span
                data-stage-label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.28em',
                  color: 'rgba(232,224,208,0.35)',
                  transition: 'color 500ms var(--ease-gentle)',
                }}
              >
                {stage}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ============ HERO — the roots ============ */}
      <section
        id="top"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 90px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <RootsCanvas />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(58% 52% at 50% 44%, rgba(15,26,20,0.74) 0%, rgba(15,26,20,0.3) 60%, rgba(15,26,20,0) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 880,
          }}
        >
          <span
            data-reveal="0"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              border: '1px solid var(--gold-line)',
              background: 'var(--gold-soft)',
              color: 'var(--gold)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius)',
            }}
          >
            Semantic journaling
          </span>
          <h1
            data-reveal="140"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'clamp(40px,5vw,62px)',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--foreground)',
              margin: '30px 0 0',
              maxWidth: 820,
            }}
          >
            Self-mastery begins in the dark —&nbsp;<em style={{ color: 'var(--gold)' }}>at the roots.</em>
          </h1>
          <p
            data-reveal="280"
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: 'rgba(232,224,208,0.72)',
              maxWidth: 540,
              margin: '26px 0 0',
            }}
          >
            Yggdrasil reads what you write and surfaces the patterns growing beneath it. You can only govern what you
            have first seen — awareness is where mastery takes root.
          </p>
          <div
            data-reveal="420"
            style={{
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              marginTop: 36,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Button size="lg" onClick={() => goTo(undefined, 'begin')}>
              Begin your practice
            </Button>
            <a href="#features" onClick={(e) => goTo(e, 'features')} className="mkt-link">
              Climb the tree ↓
            </a>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.25em',
              color: 'rgba(232,224,208,0.4)',
              textTransform: 'uppercase',
            }}
          >
            Roots · Trunk · Canopy
          </span>
          <div
            style={{
              animation: 'ygg-bob 2.6s var(--ease-gentle) infinite',
              width: 22,
              height: 34,
              borderRadius: 12,
              border: '1.5px solid rgba(232,224,208,0.25)',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 6,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ width: 3, height: 7, borderRadius: 2, background: 'var(--gold)' }} />
          </div>
        </div>
      </section>

      {/* ============ Stage divider — TRUNK ============ */}
      <StageDivider label="TRUNK" subtitle="where habits and journeys take hold" pad="56px 0 0" />

      {/* ============ FEATURES ============ */}
      <section id="features" style={{ position: 'relative', padding: '64px 24px 120px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <SectionIntro
            eyebrow="Powerful, quietly"
            title="See yourself clearly. The rest follows."
            lede="Six quiet disciplines that turn raw reflection into awareness — and awareness into steadier hands."
            marginBottom={64}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} data-reveal={f.delay} className="mkt-card">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 46,
                    height: 46,
                    borderRadius: 'var(--radius)',
                    background: 'var(--gold-soft)',
                    border: '1px solid var(--gold-line)',
                    color: 'var(--gold)',
                    marginBottom: 20,
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {f.icon}
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: 22,
                    margin: '0 0 10px',
                    color: 'var(--foreground)',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(232,224,208,0.68)', margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Stage divider — CANOPY ============ */}
      <StageDivider label="CANOPY" subtitle="where every entry becomes a leaf" pad="8px 0 0" />

      {/* ============ DEMOS ============ */}
      <section id="demos" style={{ position: 'relative', padding: '64px 24px 120px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <SectionIntro eyebrow="See it work" title="Write a little. Notice a lot." />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))',
              gap: 24,
              alignItems: 'stretch',
            }}
          >
            <ComposerDemo />
            <GraphDemo />
          </div>
        </div>
      </section>

      {/* ============ Stage divider — LIGHT ============ */}
      <StageDivider label="LIGHT" subtitle="what you tend, grows" pad="8px 0 0" />

      {/* ============ PRICING ============ */}
      <section
        id="pricing"
        style={{
          position: 'relative',
          padding: '64px 24px 120px',
          background: 'linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <SectionIntro
            eyebrow="Pricing"
            title="Choose the depth you want to keep open."
            lede="Every plan keeps journaling safe. Paid tiers unlock the layers that turn the journal into a living reflection system."
          />
          <div data-reveal="40" style={{ display: 'flex', justifyContent: 'center', margin: '-12px 0 44px' }}>
            <div
              style={{
                display: 'inline-flex',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                background: 'var(--surface)',
              }}
            >
              <button type="button" onClick={() => setBilling('monthly')} style={billingBtnStyle(billing === 'monthly')}>
                Monthly
              </button>
              <button type="button" onClick={() => setBilling('yearly')} style={billingBtnStyle(billing === 'yearly')}>
                Yearly
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            <div data-reveal="0">
              <PlanCard
                title="Free"
                price="$0"
                description="The full journal, mood tracking, and your first reflections — always."
                actionLabel="Start free"
                onAction={goSignup}
              />
            </div>
            <div data-reveal="100">
              <PlanCard
                title="Pro"
                price={billing === 'yearly' ? '$44.99/yr' : '$4.99/mo'}
                description="The full knowledge graph, deep insights, frameworks, and export tools."
                badge="Most Popular"
                subtext={billing === 'yearly' ? 'Save 25% — 3 months free' : 'Billed monthly · cancel anytime'}
                actionLabel="Begin your practice"
                onAction={goSignup}
              />
            </div>
            <div data-reveal="200">
              <PlanCard
                title="Lifetime"
                price="$149"
                description="One payment for permanent access to the paid Yggdrasil workspace."
                badge="Founding Member"
                subtext="Will increase post-launch"
                actionLabel="Choose plan"
                onAction={goSignup}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <SectionIntro eyebrow="Kept by people who return" title="A practice, not a product." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                data-reveal={t.delay}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  padding: 28,
                  borderRadius: 12,
                  background: 'var(--surface-2)',
                  border: '1px solid rgba(42,64,53,0.6)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--gold)',
                    fontSize: 44,
                    lineHeight: 0.6,
                    height: 22,
                  }}
                >
                  “
                </span>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 19,
                    lineHeight: 1.5,
                    color: 'rgba(232,224,208,0.92)',
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {t.quote}
                </p>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sage)', marginTop: 2 }}>
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section
        id="begin"
        style={{
          position: 'relative',
          padding: '132px 24px',
          overflow: 'hidden',
          background: 'radial-gradient(100% 120% at 50% 0%, #1A3C2E 0%, #0F1A14 70%)',
        }}
      >
        <FirefliesCanvas />
        <div data-reveal="0" style={{ position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <Logo size={46} />
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'clamp(34px,5vw,54px)',
              lineHeight: 1.1,
              margin: '20px 0 0',
              color: 'var(--foreground)',
            }}
          >
            Your roots begin here.
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: 'rgba(232,224,208,0.72)',
              margin: '18px auto 32px',
              maxWidth: 470,
            }}
          >
            Start writing today. Yggdrasil will quietly begin to listen — and awareness, once rooted, grows toward
            mastery on its own.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (saving) return;
              setSubscribeError(null);
              if (!email.trim()) {
                router.push('/signup');
                return;
              }
              setSaving(true);
              try {
                const res = await fetch('/api/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: email.trim(), website: honeypot }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => null);
                  if (res.status === 400) {
                    setSubscribeError(data?.error || 'That email address doesn’t look right — check it and try again.');
                    setSaving(false);
                    return;
                  }
                  // Capture hiccups shouldn't block the visitor from signing up.
                }
                router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
              } catch {
                router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
              }
            }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 460, margin: '0 auto' }}
          >
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              containerStyle={{ flex: 1, minWidth: 220 }}
            />
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
            />
            <Button size="lg" type="submit" disabled={saving}>
              {saving ? 'One moment…' : 'Begin your practice'}
            </Button>
          </form>
          {subscribeError && (
            <p style={{ fontSize: 13, color: 'rgba(224,165,165,0.9)', marginTop: 14, marginBottom: 0 }}>
              {subscribeError}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(232,224,208,0.45)', marginTop: 16 }}>
            No credit card · Your entries stay yours
          </p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--surface)', padding: '56px 32px 40px' }}>
        <div
          className="mkt-footer-grid"
          style={{
            maxWidth: 1120,
            margin: '0 auto',
          }}
        >
          <div>
            <Logo size={22} showWordmark />
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(232,224,208,0.55)', margin: '16px 0 0', maxWidth: 260 }}>
              Semantic journaling for reflection that runs deep — awareness first, mastery after, spanning philosophy,
              psychology, and spirit.
            </p>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--sage)',
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Product
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="#features" onClick={(e) => goTo(e, 'features')} className="mkt-link-sm">
                Features
              </a>
              <a href="#demos" onClick={(e) => goTo(e, 'demos')} className="mkt-link-sm">
                The Practice
              </a>
              <a href="#pricing" onClick={(e) => goTo(e, 'pricing')} className="mkt-link-sm">
                Pricing
              </a>
              <a href="#top" onClick={(e) => goTo(e, 'top')} className="mkt-link-sm">
                Changelog
              </a>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--sage)',
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Company
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['About', 'Philosophy', 'Contact'].map((label) => (
                <a key={label} href="#top" onClick={(e) => goTo(e, 'top')} className="mkt-link-sm">
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--sage)',
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Legal
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Privacy', 'Terms', 'Security'].map((label) => (
                <a key={label} href="#top" onClick={(e) => goTo(e, 'top')} className="mkt-link-sm">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            maxWidth: 1120,
            margin: '40px auto 0',
            paddingTop: 24,
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(232,224,208,0.4)' }}>
            © 2026 Yggdrasil · Rooted in old-growth wisdom
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(232,224,208,0.4)' }}>
            Grown slowly, in season
          </span>
        </div>
      </footer>
    </div>
  );
}
