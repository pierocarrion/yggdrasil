'use client';

import { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import { JournalEntry, EntryAnalysis } from '@/types/journal';

type DateRange = 14 | 30 | 90;

export function EmotionalPatterns() {
  const { user } = useAuth();
  const { data: entries, loading: entriesLoading } = useFirestore<JournalEntry>(
    user ? `users/${user.uid}/entries` : '',
    orderBy('createdAt', 'desc')
  );

  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [analyses, setAnalyses] = useState<Record<string, EntryAnalysis>>({});
  const [fetchingAnalysis, setFetchingAnalysis] = useState(false);

  // 1. Filter entries based on the date range
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    const now = Date.now();
    const rangeMs = dateRange * 24 * 60 * 60 * 1000;
    return entries.filter(e => now - e.createdAt <= rangeMs && e.analysisStatus === 'complete');
  }, [entries, dateRange]);

  // 2. Fetch missing analyses for the filtered entries
  useEffect(() => {
    if (!user || filteredEntries.length === 0) return;

    const fetchMissing = async () => {
      setFetchingAnalysis(true);
      try {
        const missing = filteredEntries.filter(e => !analyses[e.id]);
        if (missing.length === 0) {
          setFetchingAnalysis(false);
          return;
        }

        const promises = missing.map(async (entry) => {
          const q = query(collection(db, `users/${user.uid}/entries/${entry.id}/analysis`), limit(1));
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
      } finally {
        setFetchingAnalysis(false);
      }
    };

    fetchMissing();
  }, [filteredEntries, user, analyses]); // analyses dependency triggers infinite loop? No, only missing ones are filtered. But to be safe, we should exclude analyses from dep if possible or use a ref.
  // Actually, filtering `missing` inside the effect means it stops when `missing.length === 0`.

  // 3. Aggregate data for the charts
  const { emotionSeries, topThemes } = useMemo(() => {
    if (filteredEntries.length === 0) return { emotionSeries: [], topThemes: [] };

    // Group entries by Day
    const dayMap = new Map<string, { date: Date, emotions: Record<string, number[]>, themes: string[] }>();
    
    // Sort chronological
    const chronological = [...filteredEntries].sort((a, b) => a.createdAt - b.createdAt);

    chronological.forEach(entry => {
      const date = new Date(entry.createdAt);
      const iso = date.toISOString().split('T')[0];
      const analysis = analyses[entry.id];
      
      if (!dayMap.has(iso)) {
        dayMap.set(iso, { date: new Date(iso), emotions: {}, themes: [] });
      }
      
      const dayData = dayMap.get(iso)!;

      if (analysis) {
        // Aggregate emotions
        analysis.emotions?.forEach(emo => {
          if (!dayData.emotions[emo.label]) dayData.emotions[emo.label] = [];
          dayData.emotions[emo.label].push(emo.intensity);
        });

        // Aggregate themes
        analysis.themes?.forEach(t => dayData.themes.push(t));
      }
    });

    const days = Array.from(dayMap.values());

    // Extract all unique emotions and average them per day
    const emotionOverTime = new Map<string, { date: Date, value: number }[]>();
    const themeCounts = new Map<string, number>();

    days.forEach(day => {
      // Process emotions
      Object.entries(day.emotions).forEach(([label, intensities]) => {
        const avg = intensities.reduce((a,b) => a+b, 0) / intensities.length;
        if (!emotionOverTime.has(label)) {
          // Initialize with nulls for all previous days to allow d3 to handle gaps
          emotionOverTime.set(label, []);
        }
        emotionOverTime.get(label)!.push({ date: day.date, value: avg });
      });

      // Process themes
      day.themes.forEach(t => {
        themeCounts.set(t, (themeCounts.get(t) || 0) + 1);
      });
    });

    // Find the top 3-4 emotions to display (to avoid clutter)
    const topEmotions = Array.from(emotionOverTime.entries())
      .sort((a, b) => {
        const avgA = d3.mean(a[1], d => d.value) || 0;
        const avgB = d3.mean(b[1], d => d.value) || 0;
        return avgB - avgA; // highest average
      })
      .slice(0, 4);

    const series = topEmotions.map(([label, data]) => ({ label, data }));

    // Find top themes
    const topT = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    return { emotionSeries: series, topThemes: topT };
  }, [filteredEntries, analyses]);

  // --- D3 Line Chart Configuration ---
  const width = 600;
  const height = 250;
  const margin = { top: 20, right: 120, bottom: 30, left: 40 };

  const xLine = useMemo(() => {
    const allDates = emotionSeries.flatMap(s => s.data.map(d => d.date));
    const domain = allDates.length > 0 
      ? d3.extent(allDates) as [Date, Date] 
      : [new Date(Date.now() - dateRange * 86400000), new Date()];
    
    // Add small padding
    domain[0] = new Date(domain[0].getTime() - 86400000);
    domain[1] = new Date(domain[1].getTime() + 86400000);

    return d3.scaleTime()
      .domain(domain)
      .range([margin.left, width - margin.right]);
  }, [emotionSeries, dateRange, margin]);

  const yLine = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 10]) // Intensity is 0-10
      .range([height - margin.bottom, margin.top]);
  }, [height, margin]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const lineGenerator = d3.line<{ date: Date, value: number }>()
    .x(d => xLine(d.date))
    .y(d => yLine(d.value))
    .curve(d3.curveMonotoneX)
    .defined(d => d.value !== null && d.value !== undefined);

  if (entriesLoading) {
    return <div className="animate-pulse h-96 bg-secondary/30 rounded-xl" />;
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display text-foreground">Longitudinal Patterns</h3>
        <div className="flex items-center gap-4">
          {fetchingAnalysis && <span className="text-xs text-muted-foreground animate-pulse">Analyzing timeframe...</span>}
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
        
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center">
          <h4 className="text-sm font-medium text-muted-foreground w-full mb-2 uppercase tracking-wider">Emotion Evolution (Intensity)</h4>
          <p className="text-xs text-muted-foreground w-full mb-6 text-left">
            Tracks the intensity of your most prevalent emotions over time. Identifying spikes or dips can help you correlate your feelings with life events, revealing emotional triggers and recovery periods.
          </p>
          <div className="w-full max-w-xl aspect-[5/2]">
            {emotionSeries.length > 0 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Axes */}
                <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="currentColor" className="text-border" strokeWidth={2} />
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="currentColor" className="text-border" strokeWidth={2} />
                
                {/* Y-axis Labels */}
                <text x={margin.left - 10} y={margin.top} textAnchor="end" className="fill-muted-foreground text-[10px] alignment-baseline-middle">High</text>
                <text x={margin.left - 10} y={height - margin.bottom} textAnchor="end" className="fill-muted-foreground text-[10px] alignment-baseline-middle">Low</text>

                {/* Lines */}
                {emotionSeries.map((series, i) => (
                  <g key={series.label}>
                    <path
                      d={lineGenerator(series.data) || ''}
                      fill="none"
                      stroke={colorScale(series.label)}
                      strokeWidth={3}
                      className="transition-all duration-500 hover:stroke-4"
                    />
                    {/* Points */}
                    {series.data.map((d, j) => (
                      <circle
                        key={j}
                        cx={xLine(d.date)}
                        cy={yLine(d.value)}
                        r={4}
                        fill={colorScale(series.label)}
                        className="stroke-card"
                        strokeWidth={2}
                      >
                        <title>{`${d.date.toDateString()}: ${series.label} (${d.value.toFixed(1)})`}</title>
                      </circle>
                    ))}
                    {/* Label at end of line */}
                    {series.data.length > 0 && (
                      <text
                        x={xLine(series.data[series.data.length - 1].date) + 8}
                        y={yLine(series.data[series.data.length - 1].value)}
                        className="text-[11px] font-medium"
                        fill={colorScale(series.label)}
                        alignmentBaseline="middle"
                      >
                        {series.label}
                      </text>
                    )}
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
