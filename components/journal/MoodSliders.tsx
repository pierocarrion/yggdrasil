"use client";

import React from "react";
import { getMoodLabel } from "@/lib/moodLabel";

export interface MoodState {
  polarity: number;
  intensity: number;
  label: string;
}

interface MoodSlidersProps {
  mood: MoodState | null;
  onChange: (mood: MoodState | null) => void;
}

export function MoodSliders({ mood, onChange }: MoodSlidersProps) {
  const isSet = mood !== null;
  const polarity = mood?.polarity ?? 5;
  const intensity = mood?.intensity ?? 5;
  const label = mood?.label ?? "Neutral";

  const handlePolarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ polarity: val, intensity, label: getMoodLabel(val, intensity) });
  };

  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ polarity, intensity: val, label: getMoodLabel(polarity, val) });
  };

  const handleClear = () => onChange(null);

  return (
    <div className="flex flex-col gap-4 w-full p-5 border border-gray-100 rounded-xl bg-gray-50/50">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          How are you feeling? (Optional)
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`font-medium px-3 py-1 rounded-full text-sm ${
              isSet ? "bg-white border border-gray-200 text-[#1A3C2E] shadow-sm" : "text-gray-400"
            }`}
          >
            {isSet ? label : "Unset"}
          </span>
          {isSet && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-2">
        {/* Polarity Slider */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-400 w-16 text-right">Negative</span>
          <input
            type="range"
            min="0"
            max="10"
            value={polarity}
            onChange={handlePolarityChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A3C2E]"
          />
          <span className="text-xs font-medium text-gray-400 w-16 text-left">Positive</span>
        </div>

        {/* Intensity Slider */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-400 w-16 text-right">Low Energy</span>
          <input
            type="range"
            min="0"
            max="10"
            value={intensity}
            onChange={handleIntensityChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A3C2E]"
          />
          <span className="text-xs font-medium text-gray-400 w-16 text-left">High Energy</span>
        </div>
      </div>
    </div>
  );
}
