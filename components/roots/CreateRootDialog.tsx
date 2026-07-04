'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { createRoot, updateRootCore, ROOT_WHY_MAX, ROOT_FRUIT_MAX } from '@/lib/roots';
import { logGoalCreated } from '@/lib/analytics/client';
import type { Root, RootKind } from '@/types/goals';

interface CreateRootDialogProps {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this root instead of creating a new one. */
  editRoot?: Root | null;
}

const KIND_HELP: Record<RootKind, string> = {
  value: 'An ongoing practice you keep tending — it never "finishes".',
  goal: 'An achievement you can reach and complete.',
};

export function CreateRootDialog({ open, onClose, editRoot }: CreateRootDialogProps) {
  const { user } = useAuth();
  const [kind, setKind] = useState<RootKind>(editRoot?.kind ?? 'goal');
  const [title, setTitle] = useState(editRoot?.title ?? '');
  const [why, setWhy] = useState(editRoot?.why ?? '');
  const [fruitText, setFruitText] = useState(editRoot?.fruit?.text ?? '');
  const [ringLabel, setRingLabel] = useState('');
  const [ringDate, setRingDate] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const isEdit = Boolean(editRoot);

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      if (isEdit && editRoot) {
        await updateRootCore(user.uid, editRoot.id, { title, why, fruitText, kind });
        toast.success('Root updated');
      } else {
        await createRoot({
          userId: user.uid,
          kind,
          title,
          why,
          fruitText,
          ring:
            ringLabel.trim() && ringDate
              ? { label: ringLabel, targetDate: new Date(ringDate).getTime() }
              : undefined,
        });
        logGoalCreated();
        toast.success(kind === 'value' ? 'Value planted' : 'Goal planted');
      }
      onClose();
    } catch (error) {
      console.error('Failed to save root', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit root' : 'Plant a new root'}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border/60 bg-surface-2 p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-foreground mb-1">
          {isEdit ? 'Tend this root' : 'Plant a new root'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Roots are the values and goals your tree grows from.
        </p>

        {/* Kind toggle */}
        <div className="mb-5">
          <div className="flex gap-2" role="radiogroup" aria-label="Root kind">
            {(['value', 'goal'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm capitalize transition-colors ${
                  kind === k
                    ? k === 'value'
                      ? 'border-sage/60 bg-sage/10 text-sage'
                      : 'border-gold/60 bg-gold/10 text-gold'
                    : 'border-border/60 text-muted-foreground hover:border-border'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{KIND_HELP[kind]}</p>
        </div>

        {/* Title */}
        <label className="block mb-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Name</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'value' ? 'e.g. Seclusion' : 'e.g. Run a half-marathon'}
            className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none"
            maxLength={80}
            autoFocus
          />
        </label>

        {/* Why (Root) */}
        <label className="block mb-4">
          <span className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span>Root · why this matters</span>
            <span>
              {why.length}/{ROOT_WHY_MAX}
            </span>
          </span>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value.slice(0, ROOT_WHY_MAX))}
            placeholder="The deeper reason this belongs in your life…"
            rows={2}
            className="mt-1 w-full resize-none rounded-lg border border-border/60 bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none"
          />
        </label>

        {!isEdit && (
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              First ring · a milestone to grow toward (optional)
            </span>
            <div className="mt-1 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={ringLabel}
                onChange={(e) => setRingLabel(e.target.value)}
                placeholder="e.g. 30 days of morning pages"
                className="w-full sm:flex-1 min-w-0 rounded-lg border border-border/60 bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none"
                maxLength={80}
              />
              <input
                type="date"
                value={ringDate}
                onChange={(e) => setRingDate(e.target.value)}
                className="w-full sm:w-auto min-w-0 rounded-lg border border-border/60 bg-surface px-3 py-2 text-foreground focus:border-gold/50 focus:outline-none"
                aria-label="Ring target date"
              />
            </div>
          </div>
        )}

        {/* Fruit */}
        <label className="block mb-6">
          <span className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span>Fruit · proof of progress (optional)</span>
            <span>
              {fruitText.length}/{ROOT_FRUIT_MAX}
            </span>
          </span>
          <input
            type="text"
            value={fruitText}
            onChange={(e) => setFruitText(e.target.value.slice(0, ROOT_FRUIT_MAX))}
            placeholder="A measurable outcome you'd point to…"
            className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="rounded-lg border border-gold/30 bg-gold/10 px-5 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
          >
            {saving ? 'Planting…' : isEdit ? 'Save' : 'Plant root'}
          </button>
        </div>
      </div>
    </div>
  );
}
