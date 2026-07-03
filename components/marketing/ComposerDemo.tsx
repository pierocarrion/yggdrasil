'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';
import { EntryTypeChip } from './EntryTypeChip';
import { Tag, type TagVariant } from './Tag';

type InsightTag = { label: string; variant: TagVariant };
type ReflectState = 'idle' | 'thinking' | 'done';

const MAX_WORDS = 100;

const PREFILL =
  'I keep coming back to the same worry, worn smooth like a stone in my pocket. Today it felt lighter — familiar enough that I could hold it without flinching.';

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Live composer → insight demo. Visitors can rewrite the entry (up to 100
 * words) and get a real Yggi reflection back from /api/reflect. Errors from
 * the API (rate limits, outages, blocked content) surface as specific
 * messages, and safety-flagged entries show the app's safety panel.
 */
export function ComposerDemo() {
  const [reflect, setReflect] = useState<ReflectState>('idle');
  const [entryText, setEntryText] = useState(PREFILL);
  const [insightText, setInsightText] = useState('');
  const [insightTags, setInsightTags] = useState<InsightTag[]>([]);
  const [safetyConcerns, setSafetyConcerns] = useState<string[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dateLine, setDateLine] = useState('Monday, Jun 29');

  useEffect(() => {
    setDateLine(
      new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    );
  }, []);

  const words = countWords(entryText);
  const overLimit = words > MAX_WORDS;

  const runReflect = async () => {
    const text = entryText.trim();
    if (!text || overLimit || reflect === 'thinking') return;
    setReflect('thinking');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMsg(
          data?.error || "Yggdrasil couldn't reach its reflection service. Please try again in a moment.",
        );
        setReflect('idle');
        return;
      }
      const tags: InsightTag[] = (Array.isArray(data.tags) ? data.tags : [])
        .slice(0, 4)
        .map((t: { label?: unknown; variant?: unknown }) => ({
          label: String(t.label || '').slice(0, 26),
          variant: (['positive', 'framework'].includes(t.variant as string)
            ? t.variant
            : 'neutral') as TagVariant,
        }))
        .filter((t: InsightTag) => t.label);
      setInsightText(String(data.insight || ''));
      setInsightTags(tags);
      setSafetyConcerns(data.safety?.flagged ? (data.safety.concerns ?? []) : null);
      setReflect('done');
    } catch {
      setErrorMsg("Yggdrasil couldn't reach its reflection service. Please try again in a moment.");
      setReflect('idle');
    }
  };

  return (
    <div
      data-reveal="0"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-2)',
        border: '1px solid rgba(42,64,53,0.6)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(232,224,208,0.45)' }}>
          {dateLine} · Reflection
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: overLimit ? '#E0A5A5' : 'rgba(232,224,208,0.35)',
            transition: 'color 300ms var(--ease-gentle)',
          }}
        >
          {words} / {MAX_WORDS} words
        </span>
      </div>
      <textarea
        value={entryText}
        onChange={(e) => setEntryText(e.target.value)}
        rows={4}
        aria-label="Write your own journal entry"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px 24px 18px',
          margin: 0,
          fontSize: 15,
          lineHeight: 1.7,
          color: 'rgba(232,224,208,0.9)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'var(--font-sans)',
          display: 'block',
        }}
      />
      <div style={{ padding: '0 24px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <EntryTypeChip type="Reflection" selected />
      </div>
      <div style={{ marginTop: 'auto' }}>
        {reflect === 'idle' && (
          <div
            style={{
              padding: 16,
              borderTop: '1px solid var(--border-soft)',
              background: 'var(--surface)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: errorMsg ? 'rgba(224,165,165,0.9)' : 'rgba(232,224,208,0.4)',
                lineHeight: 1.5,
              }}
            >
              {errorMsg
                ? errorMsg
                : overLimit
                  ? `A little shorter, please — the demo reads up to ${MAX_WORDS} words.`
                  : 'Try it in your own words — this reflects live'}
            </span>
            <Button onClick={runReflect} disabled={!entryText.trim() || overLimit}>
              Reflect with Yggdrasil
            </Button>
          </div>
        )}
        {reflect === 'thinking' && (
          <div style={{ padding: '22px 24px', borderTop: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 17,
                color: 'rgba(232,224,208,0.6)',
              }}
            >
              Yggdrasil is thinking…
            </span>
          </div>
        )}
        {reflect === 'done' && (
          <div style={{ padding: 24, borderTop: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
            {safetyConcerns && (
              <div
                style={{
                  background: 'rgba(127,29,29,0.2)',
                  border: '1px solid rgba(239,68,68,0.5)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 18,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20, marginTop: 2 }}>⚠️</span>
                <div>
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#F87171',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px',
                    }}
                  >
                    Safety Consideration
                  </h4>
                  {safetyConcerns.map((concern, idx) => (
                    <p key={idx} style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(254,202,202,0.9)', margin: '0 0 4px' }}>
                      • {concern}
                    </p>
                  ))}
                  <p
                    style={{
                      fontSize: 12,
                      color: 'rgba(252,165,165,0.7)',
                      marginTop: 10,
                      borderTop: '1px solid rgba(127,29,29,0.5)',
                      paddingTop: 8,
                      marginBottom: 0,
                    }}
                  >
                    If you or someone else is in immediate danger, please reach out to local emergency services or a
                    crisis lifeline.
                  </p>
                </div>
              </div>
            )}
            <p
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'rgba(201,168,76,0.8)',
                fontWeight: 600,
                margin: '0 0 10px',
              }}
            >
              Yggdrasil Insight
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 20,
                lineHeight: 1.45,
                color: 'var(--foreground)',
                margin: '0 0 16px',
              }}
            >
              “{insightText}”
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {insightTags.map((tag, i) => (
                <Tag key={`${tag.label}-${i}`} variant={tag.variant}>
                  {tag.label}
                </Tag>
              ))}
            </div>
            <button type="button" onClick={() => setReflect('idle')} className="mkt-reset-link">
              ← Edit your entry and reflect again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
