"use client";

import React, { useRef, useEffect, useState } from "react";
import { EntryTypeSelector, type EntryType } from "./EntryTypeSelector";
import { MoodSliders, type MoodState } from "./MoodSliders";
import { createEntry } from "@/lib/entries";
import { auth } from "@/lib/firebase/client";
import { logEntryCreated } from "@/lib/analytics/client";

export function Composer() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState<EntryType>(null);
  const [mood, setMood] = useState<MoodState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'thinking' | 'error'>('idle');

  useEffect(() => {
    // Focus on mount so user can start typing immediately
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

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
      await createEntry({
        userId: auth.currentUser.uid,
        content,
        entryType,
        mood
      });
      
      // Calculate basic word count for analytics
      // Strip HTML tags for word count
      const textContent = content.replace(/<[^>]*>?/gm, ' ');
      const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
      
      logEntryCreated({
        entry_type: entryType ?? undefined,
        has_mood: !!mood,
        tag_count: 0,
        word_count: wordCount
      });

      // Clear composer
      setContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setEntryType(null);
      setMood(null);
      
      setSaveStatus('thinking');
      // Hide the thinking indicator after a few seconds
      setTimeout(() => setSaveStatus('idle'), 6000);
    } catch (error) {
      console.error('Failed to save entry:', error);
      setSaveStatus('error');
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
          {saveStatus === 'thinking' && (
            <span className="text-gold italic font-display animate-pulse flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
              Yggdrasil is thinking...
            </span>
          )}
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
