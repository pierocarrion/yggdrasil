"use client";

import React, { useRef, useEffect, useState } from "react";
import { EntryTypeSelector, type EntryType } from "./EntryTypeSelector";
import { MoodSliders, type MoodState } from "./MoodSliders";

export function Composer() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState<EntryType>(null);
  const [mood, setMood] = useState<MoodState | null>(null);

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

  const handleSave = () => {
    console.log("Saving entry...", { content, entryType, mood });
    // TODO: Wire up Firestore save logic for LAU-JRNL-04
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full min-h-[60vh] bg-background text-foreground border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => handleCommand("bold")}
          className="px-3 py-1.5 rounded hover:bg-gray-200 font-bold text-sm transition-colors text-gray-700"
          title="Bold (Cmd+B)"
        >
          B
        </button>
        <button
          onClick={() => handleCommand("italic")}
          className="px-3 py-1.5 rounded hover:bg-gray-200 italic text-sm transition-colors text-gray-700"
          title="Italic (Cmd+I)"
        >
          I
        </button>
        <button
          onClick={() => handleCommand("insertUnorderedList")}
          className="px-3 py-1.5 rounded hover:bg-gray-200 text-sm transition-colors text-gray-700 flex items-center gap-1"
          title="Bulleted List"
        >
          <span className="text-lg leading-none">•</span> List
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        className="flex-1 p-8 outline-none overflow-y-auto text-lg leading-relaxed
                   empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none empty:before:block"
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
      <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-[#1A3C2E] text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm"
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}
