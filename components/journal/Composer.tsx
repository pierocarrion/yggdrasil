"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { EntryTypeSelector, type EntryType } from "./EntryTypeSelector";
import { MoodSliders, type MoodState } from "./MoodSliders";
import { VoiceRecorder } from "./VoiceRecorder";
import { createEntry, updateEntry } from "@/lib/entries";
import { linkEntryToRoot } from "@/lib/roots";
import { auth } from "@/lib/firebase/client";
import { logEntryCreated, logRootEntryLinked } from "@/lib/analytics/client";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { toast } from "sonner";
import type { JournalEntry } from "@/types/journal";
import type { Root } from "@/types/goals";
import { useFirestoreDoc } from "@/hooks/useFirestore";

export interface ComposerProps {
  initialEntry?: JournalEntry;
  onSave?: (entryId: string) => void;
  /** When set, a newly saved entry is woven into this Root's journey (Reflect flow). */
  linkRootId?: string | null;
}

/** Small banner showing which Root this reflection will be woven into. */
function ReflectingOnRoot({ rootId }: { rootId: string }) {
  const { data: root } = useFirestoreDoc<Root>(
    auth.currentUser ? `users/${auth.currentUser.uid}/roots/${rootId}` : ''
  );

  if (!root) return null;

  return (
    <div className="px-4 sm:px-8 pt-4 pb-3 border-b border-border/40">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/5 px-3 py-1 text-xs text-gold/90">
        ❦ Reflecting on: {root.title}
      </span>
    </div>
  );
}

export function Composer({ initialEntry, onSave, linkRootId }: ComposerProps = {}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [entryType, setEntryType] = useState<EntryType>(() => {
    const entryTypeMap: Record<string, NonNullable<EntryType>> = {
      REFLECTION: "Reflection",
      GRATITUDE: "Gratitude",
      DREAM: "Dream",
      EVENT: "Event",
      Reflection: "Reflection",
      Gratitude: "Gratitude",
      Dream: "Dream",
      Event: "Event",
      Other: "Other",
    };

    return initialEntry?.entryType
      ? entryTypeMap[String(initialEntry.entryType)] ?? null
      : null;
  });
  const [mood, setMood] = useState<MoodState | null>(
    initialEntry?.moodLabel 
      ? { label: initialEntry.moodLabel, polarity: initialEntry.moodPolarity || 5, intensity: initialEntry.moodIntensity || 5 }
      : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNoteStoragePath, setVoiceNoteStoragePath] = useState<string | null>(null);

  const getLocalDatetimeString = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [entryDateStr, setEntryDateStr] = useState(
    initialEntry?.entryDate 
      ? getLocalDatetimeString(new Date(initialEntry.entryDate))
      : getLocalDatetimeString(new Date())
  );

  useEffect(() => {
    // Re-initialize the contentEditable when returning from recording or on first mount
    if (!isRecording && editorRef.current) {
      editorRef.current.innerHTML = content;
      editorRef.current.focus();
      
      // Move cursor to the end of the text
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch (e) {
        // Ignore selection errors
      }
    }
    // We intentionally only run this when transitioning between recording states
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleCommand = (command: string) => {
    document.execCommand(command, false, undefined);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleTranscriptReady = useCallback((transcript: string, storagePath: string) => {
    // Convert plain text transcript into HTML paragraphs for the contentEditable
    const htmlContent = transcript
      .split(/\n\n+/)
      .filter(Boolean)
      .map((p) => `<p>${p.trim()}</p>`)
      .join("");

    // Append to existing content using state callback
    setContent((prev) => {
      if (prev.trim()) {
        return prev + "<br>" + htmlContent;
      }
      return htmlContent;
    });

    setVoiceNoteStoragePath(storagePath);
    setIsRecording(false);
    toast.success("Voice note transcribed!");
  }, []);

  const handleRecordingCancel = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleSave = async () => {
    if (!content.trim() || !auth.currentUser) return;
    
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      let entryId: string;
      const textContent = content.replace(/<[^>]*>?/gm, " ");
      const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
      
      if (initialEntry) {
        await updateEntry(auth.currentUser.uid, initialEntry.id, {
          title: title.trim() || undefined,
          content,
          entryType,
          mood,
          wordCount,
          entryDate: new Date(entryDateStr).getTime()
        });
        entryId = initialEntry.id;
        toast.success("Entry updated successfully");
      } else {
        entryId = await createEntry({
          userId: auth.currentUser.uid,
          title: title.trim() || undefined,
          content,
          entryType,
          mood,
          wordCount,
          entryDate: new Date(entryDateStr).getTime()
        });
        toast.success("Entry saved successfully");

        logEntryCreated({
          entry_type: entryType ?? undefined,
          has_mood: !!mood,
          tag_count: 0,
          word_count: wordCount
        });

        // Reflect flow: weave the new entry into the Root it was written for
        if (linkRootId) {
          try {
            await linkEntryToRoot(
              auth.currentUser.uid,
              linkRootId,
              {
                id: entryId,
                title: title.trim(),
                content,
                createdAt: Date.now(),
                entryDate: new Date(entryDateStr).getTime(),
              },
              'manual'
            );
            logRootEntryLinked({ source: 'manual' });
          } catch (linkError) {
            console.error('Failed to link entry to root', linkError);
          }
        }
      }

      // Clear composer if creating new
      if (!initialEntry) {
        setTitle("");
        setContent("");
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        setEntryType(null);
        setMood(null);
        setEntryDateStr(getLocalDatetimeString(new Date()));
      }
      
      setSaveStatus('idle');
      setPendingEntryId(entryId);
      
      if (onSave) {
        onSave(entryId);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      setSaveStatus('error');
      toast.error('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full min-h-[60vh] bg-surface-2 text-foreground border border-border/60 rounded-sm shadow-md overflow-hidden">
      {linkRootId && !initialEntry && <ReflectingOnRoot rootId={linkRootId} />}
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 p-3 border-b border-border/40 bg-surface">
        <button
          onClick={() => handleCommand("bold")}
          className="px-3 py-1.5 rounded-sm hover:bg-muted/30 font-bold text-sm transition-colors text-foreground/85 hover:text-foreground cursor-pointer"
          title="Bold (Cmd+B)"
        >
          B
        </button>
        <button
          onClick={() => handleCommand("italic")}
          className="px-3 py-1.5 rounded-sm hover:bg-muted/30 italic text-sm transition-colors text-foreground/85 hover:text-foreground cursor-pointer"
          title="Italic (Cmd+I)"
        >
          I
        </button>
        <button
          onClick={() => handleCommand("insertUnorderedList")}
          className="px-3 py-1.5 rounded-sm hover:bg-muted/30 text-sm transition-colors text-foreground/85 hover:text-foreground flex items-center gap-1.5 cursor-pointer"
          title="Bulleted List"
        >
          <span className="text-lg leading-none text-sage">•</span> List
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mic button */}
        <button
          onClick={() => setIsRecording(true)}
          disabled={isRecording}
          className="px-3 py-1.5 rounded-sm hover:bg-sage/15 text-sm transition-colors text-sage hover:text-sage flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Record a voice note"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="1" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="8" y1="21" x2="16" y2="21" />
          </svg>
          Voice
        </button>
      </div>

      {/* Editor Area or Voice Recorder */}
      {isRecording ? (
        <div className="flex-1 flex items-center justify-center">
          <VoiceRecorder
            onTranscriptReady={handleTranscriptReady}
            onCancel={handleRecordingCancel}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-8 pt-8 pb-1 flex items-center">
            <input
              type="datetime-local"
              value={entryDateStr}
              onChange={(e) => setEntryDateStr(e.target.value)}
              className="bg-transparent text-sm text-muted-foreground/80 outline-none hover:text-muted-foreground transition-colors cursor-pointer"
              title="Date of the entry"
            />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Entry"
            className="w-full bg-transparent px-8 pt-1 pb-4 text-2xl sm:text-3xl font-display text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          <div
            ref={editorRef}
            className="flex-1 px-8 pb-8 outline-none overflow-y-auto text-body-lg leading-relaxed text-foreground bg-transparent
                       empty:before:content-[attr(data-placeholder)] empty:before:text-foreground/30 empty:before:pointer-events-none empty:before:block"
            contentEditable
            onInput={handleInput}
            data-placeholder="Write your entry here..."
          />
        </div>
      )}

      {/* Post-Composer Options */}
      <div className="px-4 sm:px-8 pb-8 flex flex-col gap-6">
        <MoodSliders mood={mood} onChange={setMood} />
        <EntryTypeSelector selectedType={entryType} onChange={setEntryType} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 flex justify-between items-center bg-surface">
        <div className="text-sm">
          {pendingEntryId && <ThinkingIndicator entryId={pendingEntryId} />}
          {saveStatus === 'error' && (
            <span className="text-red-400 italic">Failed to save. Please try again.</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          className="px-6 py-2.5 bg-primary text-foreground border border-gold/40 rounded-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-xs tracking-wider uppercase relative pl-8 cursor-pointer overflow-hidden group"
        >
          {/* Subtle gold left-edge line on hover */}
          <span className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-gold scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
          {isSaving ? "Saving..." : "Save Entry"}
        </button>
      </div>
    </div>
  );
}
