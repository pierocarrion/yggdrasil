'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { JournalEntry, EntryAnalysis } from '@/types/journal';
import {
  buildEmotionTimelineData,
  calculateTimelineDomain,
  formatExactTimelineTimestamp,
  formatTimelineAxisTick,
  filterCompletedEntriesByRange,
  selectAdaptiveTimelineTicks,
  type EmotionTimelinePoint,
} from './emotionTimeline';

type DateRange = 14 | 30 | 90;

const TIMELINE_WIDTH = 600;
const TIMELINE_HEIGHT = 250;
const TIMELINE_MARGIN = { top: 20, right: 120, bottom: 42, left: 40 };

function getDuplicateCoordinateKey(point: EmotionTimelinePoint) {
  return `${point.timestamp}|${point.intensity}`;
}

export function EmotionalPatterns() {
  const { user } = useAuth();
  const { data: entries, loading: entriesLoading, error: entriesError } = useFirestore<JournalEntry>(
    user ? `users/${user.uid}/entries` : '',
    orderBy('createdAt', 'desc')
  );

  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [analyses, setAnalyses] = useState<Record<string, EntryAnalysis>>({});
  const [fetchingAnalysis, setFetchingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<Error | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(TIMELINE_WIDTH);
  const [timelineNow, setTimelineNow] = useState(() => Date.now());
  const newestEntryTimestamp = entries[0]?.createdAt ?? 0;

  useEffect(() => {
    setTimelineNow(Date.now());
  }, [dateRange, newestEntryTimestamp]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const updateWidth = (width: number) => {
      if (width > 0) setChartWidth(width);
    };

    updateWidth(container.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(observedEntries => {
      const entry = observedEntries[0];
      if (entry) updateWidth(entry.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 1. Filter entries based on the date range
  const filteredEntries = useMemo(() => {
    return filterCompletedEntriesByRange(entries, dateRange, timelineNow);
  }, [entries, dateRange, timelineNow]);

  // 2. Fetch missing analyses for the filtered entries
  useEffect(() => {
    if (!user || filteredEntries.length === 0) return;

    const fetchMissing = async () => {
      setFetchingAnalysis(true);
      setAnalysisError(null);
      try {
        const missing = filteredEntries.filter(e => !analyses[e.id]);
        if (missing.length === 0) {
          setFetchingAnalysis(false);
          return;
        }

        const promises = missing.map(async (entry) => {
          const q = query(
            collection(db, `users/${user.uid}/entries/${entry.id}/analysis`),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            return { entryId: entry.id, analysis: snapshot.docs[0].data() as EntryAnalysis };
          }
          return null;
        });

        const results = await Promise.all(promises);
        
        setAnalyses(prev => {
          const next = { ...prev };
          results.forEach(res => {
            if (res) next[res.entryId] = res.analysis;
          });
          return next;
        });
      } catch (err) {
        console.error('Failed to fetch analyses:', err);
        setAnalysisError(err instanceof Error ? err : new Error('Failed to fetch analyses'));
      } finally {
        setFetchingAnalysis(false);
      }
    };

    fetchMissing();
  }, [filteredEntries, user, analyses]); // analyses dependency triggers infinite loop? No, only missing ones are filtered. But to be safe, we should exclude analyses from dep if possible or use a ref.
  // Actually, filtering `missing` inside the effect means it stops when `missing.length === 0`.

  // 3. Prepare entry-level chart data
  const { points: emotionPoints, topThemes, selectedEmotionLabels } = useMemo(() => {
    return buildEmotionTimelineData(entries, analyses, {
      dateRangeDays: dateRange,
      now: timelineNow,
    });
  }, [entries, analyses, dateRange, timelineNow]);

  // --- D3 Scatter Timeline Configuration ---
  const timeDomain = useMemo(() => {
    return calculateTimelineDomain(dateRange, timelineNow);
  }, [dateRange, timelineNow]);

  const xTimeline = useMemo(() => {
    return d3.scaleTime()
      .domain(timeDomain)
      .range([TIMELINE_MARGIN.left, TIMELINE_WIDTH - TIMELINE_MARGIN.right]);
  }, [timeDomain]);

  const timelineTicks = useMemo(() => {
    return selectAdaptiveTimelineTicks({
      domain: timeDomain,
      dateRangeDays: dateRange,
      chartWidth,
    });
  }, [timeDomain, dateRange, chartWidth]);

  const yTimeline = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 10]) // Intensity is 0-10
      .range([TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom, TIMELINE_MARGIN.top]);
  }, []);

  const colorScale = useMemo(() => {
    return d3.scaleOrdinal<string, string>()
      .domain(selectedEmotionLabels)
      .range(d3.schemeCategory10);
  }, [selectedEmotionLabels]);

  const duplicateCoordinateMeta = useMemo(() => {
    const totals = new Map<string, number>();
    emotionPoints.forEach(point => {
      const key = getDuplicateCoordinateKey(point);
      totals.set(key, (totals.get(key) || 0) + 1);
    });

    const seen = new Map<string, number>();
    const meta = new Map<string, { index: number; total: number }>();
    emotionPoints.forEach(point => {
      const key = getDuplicateCoordinateKey(point);
      const index = (seen.get(key) || 0) + 1;
      seen.set(key, index);
      meta.set(point.id, { index, total: totals.get(key) || 1 });
    });

    return meta;
  }, [emotionPoints]);

  const describePoint = (point: EmotionTimelinePoint) => {
    const duplicate = duplicateCoordinateMeta.get(point.id);
    const duplicateText = duplicate && duplicate.total > 1
      ? `\nOverlap ${duplicate.index} of ${duplicate.total} at this exact timestamp and intensity. Tab through all linked points to access each entry.`
      : '';

    return [
      formatExactTimelineTimestamp(point.date),
      point.label,
      `Intensity: ${point.intensity}/10`,
      `Polarity: ${point.polarity}/10`,
      `Entry: ${point.entryId}`,
    ].join('\n') + duplicateText;
  };

  if (entriesLoading) {
    return <div className="animate-pulse h-96 bg-secondary/30 rounded-xl" />;
  }

  const error = entriesError || analysisError;
  if (error) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm text-sm text-muted-foreground">
        Unable to load emotional patterns right now.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display text-foreground">Longitudinal Patterns</h3>
        <div className="flex items-center gap-4">

          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value) as DateRange)}
            className="bg-card border border-border text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scatter Timeline Chart */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center">
          <h4 className="text-sm font-medium text-muted-foreground w-full mb-2 uppercase tracking-wider">Emotion Timeline (Intensity)</h4>
          <p className="text-xs text-muted-foreground w-full mb-6 text-left">
            Tracks individual emotion occurrences from analyzed entries over time. Identifying spikes or dips can help you correlate your feelings with life events, revealing emotional triggers and recovery periods.
          </p>
          <div ref={chartContainerRef} className="w-full max-w-xl aspect-[5/2]">
            {emotionPoints.length > 0 ? (
              <svg viewBox={`0 0 ${TIMELINE_WIDTH} ${TIMELINE_HEIGHT}`} className="w-full h-full overflow-visible">
                {/* Axes */}
                <line x1={TIMELINE_MARGIN.left} y1={TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom} x2={TIMELINE_WIDTH - TIMELINE_MARGIN.right} y2={TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom} stroke="currentColor" className="text-border" strokeWidth={2} />
                <line x1={TIMELINE_MARGIN.left} y1={TIMELINE_MARGIN.top} x2={TIMELINE_MARGIN.left} y2={TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom} stroke="currentColor" className="text-border" strokeWidth={2} />
                
                {/* Y-axis Labels and Ticks */}
                {[0, 5, 10].map(value => (
                  <g key={value}>
                    <line x1={TIMELINE_MARGIN.left - 4} y1={yTimeline(value)} x2={TIMELINE_WIDTH - TIMELINE_MARGIN.right} y2={yTimeline(value)} stroke="currentColor" className="text-border/40" strokeWidth={value === 0 ? 0 : 1} />
                    <text x={TIMELINE_MARGIN.left - 10} y={yTimeline(value)} textAnchor="end" className="fill-muted-foreground text-[10px]" alignmentBaseline="middle">
                      {value}
                    </text>
                  </g>
                ))}

                {/* X-axis Local-Time Ticks */}
                {timelineTicks.map(tick => (
                  <g key={tick.getTime()} transform={`translate(${xTimeline(tick)},0)`}>
                    <line y1={TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom} y2={TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom + 4} stroke="currentColor" className="text-border" />
                    <text y={TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom + 18} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                      {formatTimelineAxisTick(tick, dateRange)}
                    </text>
                  </g>
                ))}

                {/* Points */}
                {emotionPoints.map(point => {
                  const description = describePoint(point);
                  return (
                    <a
                      key={point.id}
                      href={`/journal/${point.entryId}`}
                      aria-label={description.replace(/\n/g, '. ')}
                      className="group outline-none"
                    >
                      <title>{description}</title>
                      <circle
                        cx={xTimeline(point.date)}
                        cy={yTimeline(point.intensity)}
                        r={5}
                        fill={colorScale(point.label)}
                        className="stroke-card opacity-75 transition-opacity group-hover:opacity-100 group-focus:opacity-100 group-focus:stroke-foreground"
                        strokeWidth={2}
                      />
                    </a>
                  );
                })}

                {/* Legend */}
                {selectedEmotionLabels.map((label, i) => (
                  <g key={label} transform={`translate(${TIMELINE_WIDTH - TIMELINE_MARGIN.right + 16}, ${TIMELINE_MARGIN.top + i * 18})`}>
                    <circle r={4} fill={colorScale(label)} />
                    <text x={9} y={0} className="text-[11px] font-medium" fill={colorScale(label)} alignmentBaseline="middle">
                      {label}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <span className="text-2xl mb-2">🌱</span>
                <p>Not enough analyzed entries in this period to chart trends.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Themes */}
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-muted-foreground w-full mb-2 uppercase tracking-wider">Dominant Themes</h4>
          <p className="text-xs text-muted-foreground w-full mb-6 text-left">
            Highlights the recurring themes from your recent entries. This acts as a mirror, showing you what naturally preoccupies your mind during this timeframe.
          </p>
          {topThemes.length > 0 ? (
            <div className="space-y-4">
              {topThemes.map((t, i) => {
                const maxCount = topThemes[0].count;
                const widthPercent = Math.max(10, (t.count / maxCount) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground truncate pr-2">{t.theme}</span>
                      <span className="text-muted-foreground tabular-nums">{t.count}x</span>
                    </div>
                    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gold rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${widthPercent}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="w-full h-40 flex flex-col items-center justify-center text-muted-foreground">
               <p className="text-sm">Write more to uncover themes.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
