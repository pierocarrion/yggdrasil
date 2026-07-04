'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  achieveRing,
  addRing,
  completeFruit,
  isWeekStale,
  setRootStatus,
  updateRootCore,
  ROOT_WHY_MAX,
  ROOT_FRUIT_MAX,
} from '@/lib/roots';
import { logGoalCompleted, logGoalDeleted } from '@/lib/analytics/client';
import { BranchList } from './BranchList';
import { JourneyTimeline } from './JourneyTimeline';
import { SuggestionBanner } from './SuggestionBanner';
import { CreateRootDialog } from './CreateRootDialog';
import type { Root, RootLinkSuggestion } from '@/types/goals';

const STATUS_LABEL: Record<Root['status'], string> = {
  active: 'In Journey',
  completed: 'Completed',
  archived: 'Archived',
};

function formatDate(millis: number): string {
  return new Date(millis).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface RootCardProps {
  root: Root;
  suggestions: RootLinkSuggestion[];
  defaultExpanded?: boolean;
}

export function RootCard({ root, suggestions, defaultExpanded = false }: RootCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);
  const [editingWhy, setEditingWhy] = useState(false);
  const [whyDraft, setWhyDraft] = useState(root.why);
  const [addingRing, setAddingRing] = useState(false);
  const [ringLabel, setRingLabel] = useState('');
  const [ringDate, setRingDate] = useState('');

  if (!user) return null;

  const wins = isWeekStale(root) ? 0 : root.winsThisWeek;
  // Upcoming rings sorted by due date (soonest first); achieved rings kept as history.
  const upcomingRings = root.rings
    .filter((r) => !r.achievedAt)
    .sort((a, b) => a.targetDate - b.targetDate);
  const achievedRings = root.rings
    .filter((r) => r.achievedAt)
    .sort((a, b) => (a.achievedAt ?? 0) - (b.achievedAt ?? 0));
  const isValue = root.kind === 'value';
  const isActive = root.status === 'active';

  const saveWhy = async () => {
    setEditingWhy(false);
    if (whyDraft.trim() === root.why) return;
    try {
      await updateRootCore(user.uid, root.id, { why: whyDraft });
    } catch (error) {
      console.error('Failed to update why', error);
      toast.error('Failed to save');
      setWhyDraft(root.why);
    }
  };

  const handleAddRing = async () => {
    if (!ringLabel.trim() || !ringDate) return;
    try {
      await addRing(user.uid, root.id, { label: ringLabel, targetDate: new Date(ringDate).getTime() });
      setAddingRing(false);
      setRingLabel('');
      setRingDate('');
    } catch (error) {
      console.error('Failed to add ring', error);
      toast.error('Failed to add ring');
    }
  };

  const handleComplete = async () => {
    try {
      await setRootStatus(user.uid, root.id, 'completed');
      logGoalCompleted();
      toast.success('A goal fulfilled. The tree remembers.');
    } catch (error) {
      console.error('Failed to complete root', error);
      toast.error('Failed to complete');
    }
  };

  const handleArchive = async () => {
    try {
      await setRootStatus(user.uid, root.id, 'archived');
      logGoalDeleted();
      toast('Root archived', { description: 'You can restore it from the Archived section.' });
    } catch (error) {
      console.error('Failed to archive root', error);
      toast.error('Failed to archive');
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-surface-2/80 shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={expanded}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base ${
            isValue ? 'border-sage/30 bg-sage/10 text-sage' : 'border-gold/30 bg-gold/10 text-gold'
          }`}
          aria-hidden
        >
          {isValue ? '❦' : '✦'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg text-foreground">{root.title}</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                isValue ? 'border-sage/30 text-sage' : 'border-gold/30 text-gold'
              }`}
            >
              {root.kind}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] ${
                root.status === 'active'
                  ? 'border-sage/30 bg-sage/10 text-sage'
                  : 'border-border/60 bg-surface text-muted-foreground'
              }`}
            >
              {STATUS_LABEL[root.status]}
            </span>
            {wins > 0 && (
              <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                {wins} {wins === 1 ? 'win' : 'wins'} this week
              </span>
            )}
            {suggestions.length > 0 && (
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full bg-dream/80 text-[9px] font-semibold text-background"
                title={`${suggestions.length} suggested ${suggestions.length === 1 ? 'entry' : 'entries'}`}
              >
                {suggestions.length}
              </span>
            )}
          </span>
          {root.why && !expanded && (
            <span className="mt-0.5 block truncate text-sm italic text-muted-foreground">
              “{root.why}”
            </span>
          )}
        </span>
        <span
          className={`shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ⌄
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border/40 px-5 py-5 space-y-6">
          {/* Pending suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <SuggestionBanner key={s.id} suggestion={s} />
              ))}
            </div>
          )}

          {/* Root · why this matters */}
          <div>
            <span className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>Root · why this matters</span>
              {editingWhy && (
                <span>
                  {whyDraft.length}/{ROOT_WHY_MAX}
                </span>
              )}
            </span>
            {editingWhy ? (
              <textarea
                value={whyDraft}
                onChange={(e) => setWhyDraft(e.target.value.slice(0, ROOT_WHY_MAX))}
                onBlur={saveWhy}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveWhy();
                  }
                }}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-gold/40 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setWhyDraft(root.why);
                  setEditingWhy(true);
                }}
                className={`mt-1 w-full rounded-lg border border-dashed px-3 py-2 text-left text-sm transition-colors ${
                  root.why
                    ? 'border-border/40 text-foreground/90 hover:border-border'
                    : 'border-border/60 italic text-muted-foreground/60 hover:border-gold/40'
                }`}
              >
                {root.why || 'Click to add why this matters…'}
              </button>
            )}
          </div>

          {/* Rings · milestones */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Rings · milestones of growth
              </span>
              {!addingRing && isActive && (
                <button
                  type="button"
                  onClick={() => setAddingRing(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Set a ring
                </button>
              )}
            </div>

            {upcomingRings.length > 0 && (
              <div className="mt-1 space-y-1.5">
                {upcomingRings.map((ring) => (
                  <div
                    key={ring.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-surface px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => achieveRing(user.uid, root, ring.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/50 text-transparent transition-colors hover:bg-gold/20 hover:text-gold"
                      aria-label={`Mark ring "${ring.label}" achieved`}
                    >
                      ✓
                    </button>
                    <span className="flex-1 text-sm text-foreground/90">{ring.label}</span>
                    <span className="rounded-full border border-gold/25 px-2 py-0.5 text-[10px] text-gold/80">
                      🗓 {formatDate(ring.targetDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {addingRing && (
              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={ringLabel}
                  onChange={(e) => setRingLabel(e.target.value)}
                  placeholder="The next milestone…"
                  className="w-full sm:flex-1 min-w-0 rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none"
                  maxLength={80}
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={ringDate}
                    onChange={(e) => setRingDate(e.target.value)}
                    className="flex-1 sm:flex-none min-w-0 rounded-lg border border-border/60 bg-surface px-2 py-1.5 text-sm text-foreground focus:border-gold/50 focus:outline-none"
                    aria-label="Ring target date"
                  />
                  <button
                    type="button"
                    onClick={handleAddRing}
                    disabled={!ringLabel.trim() || !ringDate}
                    className="shrink-0 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-sm text-gold hover:bg-gold/20 disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
              </div>
            )}

            {achievedRings.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {achievedRings.map((ring) => (
                  <span
                    key={ring.id}
                    className="rounded-full border border-sage/30 bg-sage/10 px-2 py-0.5 text-[10px] text-sage"
                    title={ring.achievedAt ? `Achieved ${formatDate(ring.achievedAt)}` : undefined}
                  >
                    ◉ {ring.label}
                  </span>
                ))}
              </div>
            )}

            {upcomingRings.length === 0 && !addingRing && achievedRings.length === 0 && (
              <p className="mt-1 text-sm italic text-muted-foreground/60">
                No ring set — a ring is the next milestone your tree grows toward.
              </p>
            )}
          </div>

          {/* Branches */}
          {isActive && <BranchList root={root} />}

          {/* Fruit */}
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Fruit · proof of progress
            </span>
            {root.fruit ? (
              <div className="mt-1 flex items-center gap-3 rounded-lg border border-border/40 bg-surface px-3 py-2">
                <button
                  type="button"
                  onClick={() => completeFruit(user.uid, root)}
                  disabled={Boolean(root.fruit.completedAt)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    root.fruit.completedAt
                      ? 'border-sage/60 bg-sage/20 text-sage'
                      : 'border-sage/40 text-transparent hover:bg-sage/10 hover:text-sage'
                  }`}
                  aria-label={root.fruit.completedAt ? 'Fruit ripened' : 'Mark fruit ripened'}
                >
                  ✓
                </button>
                <span
                  className={`text-sm ${
                    root.fruit.completedAt ? 'text-muted-foreground line-through' : 'text-foreground/90'
                  }`}
                >
                  {root.fruit.text}
                </span>
              </div>
            ) : (
              <FruitEditor root={root} userId={user.uid} />
            )}
          </div>

          {/* Trunk · journey */}
          <JourneyTimeline root={root} />

          {/* Footer actions */}
          <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
            <Link
              href={`/journal?rootId=${root.id}`}
              className="rounded-lg border border-border/60 px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-gold/40 hover:text-gold"
            >
              ♡ Reflect
            </Link>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-border/60 px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-border hover:text-foreground"
            >
              ✎ Edit
            </button>
            {!isValue && isActive && (
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-lg border border-sage/30 px-3.5 py-1.5 text-sm text-sage transition-colors hover:bg-sage/10"
              >
                ✓ Complete
              </button>
            )}
            {isActive ? (
              <button
                type="button"
                onClick={handleArchive}
                className="rounded-lg border border-border/60 px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                Archive
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRootStatus(user.uid, root.id, 'active')}
                className="rounded-lg border border-border/60 px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-sage/40 hover:text-sage"
              >
                Restore
              </button>
            )}
          </div>
        </div>
      )}

      {editing && <CreateRootDialog open onClose={() => setEditing(false)} editRoot={root} />}
    </div>
  );
}

function FruitEditor({ root, userId }: { root: Root; userId: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const save = async () => {
    if (!text.trim()) {
      setEditing(false);
      return;
    }
    try {
      await updateRootCore(userId, root.id, { fruitText: text });
      setEditing(false);
      setText('');
    } catch (error) {
      console.error('Failed to save fruit', error);
      toast.error('Failed to save');
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 w-full rounded-lg border border-dashed border-border/60 px-3 py-2 text-left text-sm italic text-muted-foreground/60 transition-colors hover:border-sage/40"
      >
        Click to define a measurable outcome…
      </button>
    );
  }

  return (
    <div className="mt-1 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, ROOT_FRUIT_MAX))}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        placeholder="A measurable outcome you'd point to…"
        className="flex-1 rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-sage/50 focus:outline-none"
        autoFocus
      />
      <button
        type="button"
        onClick={save}
        className="rounded-lg border border-sage/30 bg-sage/10 px-3 py-1.5 text-sm text-sage hover:bg-sage/20"
      >
        Save
      </button>
    </div>
  );
}
