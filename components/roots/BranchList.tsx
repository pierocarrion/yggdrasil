'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureGate } from '@/components/billing/FeatureGate';
import {
  addBranch,
  cycleBranchStatus,
  removeBranch,
  setBranchStatus,
  startNewWeek,
  BRANCH_LABEL_MAX,
} from '@/lib/roots';
import { logBranchCompleted, logBranchWeekReset, logBranchActionsGenerated } from '@/lib/analytics/client';
import type { BranchAction, BranchStatus, Root } from '@/types/goals';

const STATUS_LABEL: Record<BranchStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
};

const STATUS_CHIP: Record<BranchStatus, string> = {
  not_started: 'bg-surface text-muted-foreground border-border/60',
  in_progress: 'bg-gold/10 text-gold border-gold/30',
  done: 'bg-sage/10 text-sage border-sage/30',
};

interface GeneratedBranch {
  label: string;
  rationale: string;
}

function StatusIcon({ status }: { status: BranchStatus }) {
  if (status === 'done') {
    return (
      <svg className="h-4 w-4 text-sage" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'in_progress') {
    return (
      <svg className="h-4 w-4 text-gold" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 2a6 6 0 016 6H8V2z" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function BranchList({ root }: { root: Root }) {
  const { user } = useAuth();
  const subscription = useSubscription();
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmingNewWeek, setConfirmingNewWeek] = useState(false);
  const [growing, setGrowing] = useState(false);
  const [proposals, setProposals] = useState<GeneratedBranch[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  if (!user) return null;

  const branches = [...root.branches].sort((a, b) => a.order - b.order);
  const doneCount = branches.filter((b) => b.status === 'done').length;
  const progress = branches.length > 0 ? Math.round((doneCount / branches.length) * 100) : 0;

  const hasUnachievedRing = root.rings.some((r) => !r.achievedAt);
  const canGrow = root.why.trim().length > 0 && hasUnachievedRing;
  const isPro = subscription.entitlement === 'PRO';

  const handleCycle = async (branch: BranchAction) => {
    const next = cycleBranchStatus(branch.status);
    try {
      await setBranchStatus(user.uid, root, branch.id, next);
      if (next === 'done') {
        logBranchCompleted({ source: branch.source });
      }
    } catch (error) {
      console.error('Failed to update branch', error);
      toast.error('Failed to update practice');
    }
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    try {
      await addBranch(user.uid, root, newLabel);
      setNewLabel('');
      setAdding(false);
    } catch (error) {
      console.error('Failed to add branch', error);
      toast.error('Failed to add practice');
    }
  };

  const handleNewWeek = async () => {
    try {
      logBranchWeekReset({ done_count: doneCount, total_count: branches.length });
      await startNewWeek(user.uid, root);
      setConfirmingNewWeek(false);
      toast.success('A new week begins. Last week is kept in the trunk.');
    } catch (error) {
      console.error('Failed to start new week', error);
      toast.error('Failed to start a new week');
    }
  };

  const handleGrow = async () => {
    setGrowing(true);
    setProposals(null);
    try {
      const generate = httpsCallable<{ rootId: string }, { branches: GeneratedBranch[] }>(
        functions,
        'generateBranchActions'
      );
      const result = await generate({ rootId: root.id });
      const generated = result.data.branches ?? [];
      logBranchActionsGenerated({ branch_count: generated.length });
      setProposals(generated);
      setSelected(new Set(generated.map((_, i) => i)));
    } catch (error) {
      console.error('Failed to grow branches', error);
      toast.error('The branches would not grow. Please try again.');
    } finally {
      setGrowing(false);
    }
  };

  const handleAddSelected = async () => {
    if (!proposals) return;
    try {
      // Sequential so each branch gets the correct order index
      let current = root;
      for (const index of [...selected].sort((a, b) => a - b)) {
        const proposal = proposals[index];
        await addBranch(user.uid, current, proposal.label, 'ai');
        current = {
          ...current,
          branches: [
            ...current.branches,
            {
              id: 'pending',
              label: proposal.label,
              status: 'not_started',
              source: 'ai',
              order: current.branches.length,
            },
          ],
        };
      }
      setProposals(null);
      toast.success('New branches grafted onto your week.');
    } catch (error) {
      console.error('Failed to add branches', error);
      toast.error('Failed to add branches');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Branches · this week&apos;s practices
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + Add
          </button>
          {branches.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmingNewWeek(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ⟳ New week
            </button>
          )}
        </div>
      </div>

      {branches.length === 0 && !adding && (
        <p className="py-3 text-center text-sm text-muted-foreground/70">
          No practices yet this week
        </p>
      )}

      <ul className="space-y-1">
        {branches.map((branch) => (
          <li key={branch.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-surface/60">
            <button
              type="button"
              onClick={() => handleCycle(branch)}
              className="flex flex-1 items-center gap-2.5 text-left"
              aria-label={`${branch.label} — ${STATUS_LABEL[branch.status]}. Click to advance.`}
            >
              <StatusIcon status={branch.status} />
              <span
                className={`flex-1 text-sm ${
                  branch.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                {branch.label}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS_CHIP[branch.status]}`}>
                {STATUS_LABEL[branch.status]}
              </span>
            </button>
            <button
              type="button"
              onClick={() => removeBranch(user.uid, root, branch.id)}
              className="text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label={`Remove ${branch.label}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value.slice(0, BRANCH_LABEL_MAX))}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="A practice for this week…"
            className="flex-1 rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newLabel.trim()}
            className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-sm text-gold hover:bg-gold/20 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewLabel('');
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Grow Branches (Pro): turns journaled self-awareness into weekly practice */}
      <div className="mt-3 flex justify-center">
        {isPro ? (
          <div className="relative group/grow">
            <button
              type="button"
              onClick={handleGrow}
              disabled={!canGrow || growing}
              className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-1.5 text-sm text-gold transition-colors hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {growing ? (
                <span className="animate-pulse">Listening to your journal…</span>
              ) : (
                <>✦ Grow branches</>
              )}
            </button>
            {!canGrow && (
              <span
                role="tooltip"
                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/60 bg-surface px-2.5 py-1 text-xs text-muted-foreground opacity-0 shadow-md transition-opacity group-hover/grow:opacity-100"
              >
                Plant your Root and set a Ring first
              </span>
            )}
          </div>
        ) : (
          <FeatureGate
            blocked
            label="Grow branches with AI on Pro."
            fallback={
              <a
                href="/pricing"
                className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-1.5 text-sm text-gold/70 transition-colors hover:bg-gold/10"
              >
                ✦ Grow branches · Pro
              </a>
            }
          />
        )}
      </div>

      {/* Review generated branches before committing them */}
      {proposals && (
        <div className="mt-3 rounded-xl border border-gold/20 bg-gold/5 p-3">
          <p className="mb-2 text-xs text-gold/80">
            Grown from your Root and what your journal has been saying. Keep the ones that fit.
          </p>
          {proposals.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing grew this time — try again soon.</p>
          )}
          <ul className="space-y-2">
            {proposals.map((proposal, index) => (
              <li key={index}>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(index)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(index);
                      else next.delete(index);
                      setSelected(next);
                    }}
                    className="mt-1 accent-[#C9A84C]"
                  />
                  <span>
                    <span className="block text-sm text-foreground">{proposal.label}</span>
                    <span className="block text-xs italic text-muted-foreground">{proposal.rationale}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {proposals.length > 0 && (
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProposals(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={selected.size === 0}
                className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm text-gold hover:bg-gold/20 disabled:opacity-50"
              >
                Add {selected.size} selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {branches.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gold/70 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}% done</span>
        </div>
      )}

      {/* New week confirmation */}
      {confirmingNewWeek && (
        <div className="mt-3 rounded-xl border border-border/60 bg-surface p-3 text-sm">
          <p className="text-foreground/90">
            Begin a new week? This week&apos;s outcomes ({doneCount}/{branches.length} done) are kept in the
            trunk, and every branch resets.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingNewWeek(false)}
              className="rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground"
            >
              Not yet
            </button>
            <button
              type="button"
              onClick={handleNewWeek}
              className="rounded-lg border border-sage/30 bg-sage/10 px-3 py-1 text-sage hover:bg-sage/20"
            >
              New week
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
