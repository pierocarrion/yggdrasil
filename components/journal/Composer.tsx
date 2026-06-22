"use client";

import React, { useRef, useEffect, useState } from "react";
import { EntryTypeSelector, type EntryType } from "./EntryTypeSelector";
import { MoodSliders, type MoodState } from "./MoodSliders";
import { createEntry, updateEntry } from "@/lib/entries";
import { auth } from "@/lib/firebase/client";
import { logEntryCreated } from "@/lib/analytics/client";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { toast } from "sonner";
import type { JournalEntry } from "@/types/journal";

export interface ComposerProps {
  initialEntry?: JournalEntry;
  onSave?: (entryId: string) => void;
}

export function Composer({ initialEntry, onSave }: ComposerProps = {}) {
  const editorRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    // Focus on mount so user can start typing immediately
    if (editorRef.current) {
      if (initialEntry) {
        editorRef.current.innerHTML = initialEntry.content;
      }
      editorRef.current.focus();
    }
  }, [initialEntry]);

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
          content,
          entryType,
          mood,
          wordCount
        });
        entryId = initialEntry.id;
        toast.success("Entry updated successfully");
      } else {
        entryId = await createEntry({
          userId: auth.currentUser.uid,
          content,
          entryType,
          mood,
          wordCount
        });
        toast.success("Entry saved successfully");
        
        logEntryCreated({
          entry_type: entryType ?? undefined,
          has_mood: !!mood,
          tag_count: 0,
          word_count: wordCount
        });
      }

      // Clear composer if creating new
      if (!initialEntry) {
        setContent("");
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        setEntryType(null);
        setMood(null);
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
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        className="flex-1 p-8 outline-none overflow-y-auto text-body-lg leading-relaxed text-foreground bg-transparent
                   empty:before:content-[attr(data-placeholder)] empty:before:text-foreground/30 empty:before:pointer-events-none empty:before:block"
        contentEditable
        onInput={handleInput}
        data-placeholder="Write your entry here..."
      />

      {/* Post-Composer Options */}
      <div className="px-8 pb-8 flex flex-col gap-6">
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
