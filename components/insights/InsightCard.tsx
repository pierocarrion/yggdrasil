'use client';

import React, { useState } from 'react';
import type { EntryAnalysis } from '@/types/journal';

interface InsightCardProps {
  analysis: EntryAnalysis;
}

export function InsightCard({ analysis }: InsightCardProps) {
  const { interpretation, themes, emotions, keywords, safety_concerns } = analysis;
  
  const [showDepth, setShowDepth] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showActionItems, setShowActionItems] = useState(false);

  return (
    <div className="bg-surface-2 border border-border/60 rounded-xl p-6 sm:p-8 shadow-sm transition-all duration-300">
      <div className="space-y-6">
        {/* Safety Warning */}
        {safety_concerns?.flagged && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">Safety Consideration</h4>
                <ul className="space-y-1">
                  {safety_concerns.concerns.map((concern, idx) => (
                    <li key={idx} className="text-sm text-red-200/90 leading-relaxed">• {concern}</li>
                  ))}
                </ul>
                <p className="text-xs text-red-300/70 mt-3 border-t border-red-900/50 pt-2">
                  If you or someone else is in immediate danger, please reach out to local emergency services or a crisis lifeline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header / Main Insight */}
        <div>
          <h3 className="text-sm uppercase tracking-widest text-gold/80 mb-3 font-semibold">
            Yggdrasil Insight
          </h3>
          <p className="font-display italic text-2xl sm:text-3xl text-foreground leading-relaxed">
            &quot;{interpretation.main_insight}&quot;
          </p>
        </div>

        {/* Growth Connection */}
        {interpretation.growth_connection && (
          <div className="pt-2">
             <p className="text-sm text-foreground/70 leading-relaxed border-l-2 border-gold/30 pl-4">
               {interpretation.growth_connection}
             </p>
          </div>
        )}

        {/* Themes, Emotions & Keywords */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-6 pt-4 border-t border-border/40">
          {/* Themes */}
          {themes && themes.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Themes</h4>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-surface rounded-full text-xs text-foreground/90 border border-border/50"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Emotions */}
          {emotions && emotions.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Resonant Emotions</h4>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion, idx) => {
                  const isPositive = emotion.polarity > 5;
                  const isNegative = emotion.polarity < 5;
                  
                  return (
                    <span 
                      key={idx} 
                      className={`px-3 py-1 rounded-full text-xs border ${
                        isPositive ? 'bg-sage/10 text-sage border-sage/20' : 
                        isNegative ? 'bg-red-900/10 text-red-300 border-red-900/20' : 
                        'bg-surface text-foreground/80 border-border/50'
                      }`}
                      title={`Intensity: ${emotion.intensity}/10`}
                    >
                      {emotion.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keywords */}
          {keywords && keywords.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-surface rounded-full text-xs text-foreground/70 border border-border/40"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Patterns & Frameworks */}
        {((interpretation.patterns_identified?.length ?? 0) > 0 || (interpretation.frameworks_applied?.length ?? 0) > 0) && (
          <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-border/40">
            {(interpretation.patterns_identified?.length ?? 0) > 0 && (
              <div className="flex-1">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Patterns Identified</h4>
                <ul className="space-y-2">
                  {interpretation.patterns_identified.map((pattern, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-border mt-0.5">•</span>
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(interpretation.frameworks_applied?.length ?? 0) > 0 && (
              <div className="flex-1">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Frameworks Applied</h4>
                <div className="flex flex-wrap gap-2">
                  {interpretation.frameworks_applied?.map((fw, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-surface-2 rounded-full text-xs text-foreground/80 border border-gold/30"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deep Analysis */}
        {interpretation.depth_analysis && (
          <div className="pt-4 border-t border-border/40">
             <button 
               onClick={() => setShowDepth(!showDepth)}
               className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2 hover:text-gold transition-colors w-full text-left focus:outline-none"
             >
               <span>Depth Analysis</span>
               <svg className={`w-3 h-3 transition-transform duration-200 ${showDepth ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </button>
             {showDepth && (
               <p className="text-sm text-foreground/80 leading-relaxed bg-surface-2 p-4 rounded-xl border border-border/30 mt-2 animate-in fade-in slide-in-from-top-2">
                 {interpretation.depth_analysis}
               </p>
             )}
          </div>
        )}

        {/* Questions & Action Items */}
        {(interpretation.questions?.length > 0 || interpretation.action_items?.length > 0) && (
          <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-border/40">
            {interpretation.questions?.length > 0 && (
              <div className="flex-1">
                <button 
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3 hover:text-gold transition-colors w-full text-left focus:outline-none"
                >
                  <span>Questions for Reflection</span>
                  <svg className={`w-3 h-3 transition-transform duration-200 ${showQuestions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {showQuestions && (
                  <ul className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    {interpretation.questions.map((q, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-gold/50 mt-0.5 font-display italic">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {interpretation.action_items?.length > 0 && (
              <div className="flex-1">
                <button 
                  onClick={() => setShowActionItems(!showActionItems)}
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3 hover:text-gold transition-colors w-full text-left focus:outline-none"
                >
                  <span>Action Items</span>
                  <svg className={`w-3 h-3 transition-transform duration-200 ${showActionItems ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {showActionItems && (
                  <ul className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    {interpretation.action_items.map((item, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-sage/50 mt-0.5">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
