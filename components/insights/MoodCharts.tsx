'use client';

import { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import { JournalEntry } from '@/types/journal';

type DateRange = 7 | 30 | 90 | 0; // 0 means All Time

const FREQ_MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };
const SCATTER_MARGIN = { top: 30, right: 30, bottom: 40, left: 40 };

export function MoodCharts() {
  const { user } = useAuth();
  const { data: entries, loading } = useFirestore<JournalEntry>(
    user ? `users/${user.uid}/entries` : '',
    orderBy('createdAt', 'desc')
  );

  const [dateRange, setDateRange] = useState<DateRange>(30);

  const { filteredEntries, frequencyData, scatterData } = useMemo(() => {
    if (!entries) return { filteredEntries: [], frequencyData: [], scatterData: [] };

    const now = Date.now();
    const rangeMs = dateRange === 0 ? Infinity : dateRange * 24 * 60 * 60 * 1000;

    const filtered = entries.filter(e => now - e.createdAt <= rangeMs);

    // Group for frequency chart (by day)
    const freqMap = new Map<string, number>();
    filtered.forEach(e => {
      const dateStr = new Date(e.createdAt).toISOString().split('T')[0];
      freqMap.set(dateStr, (freqMap.get(dateStr) || 0) + 1);
    });

    const frequencyList = Array.from(freqMap.entries())
      .map(([date, count]) => ({ date: new Date(date), count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Prepare scatter data
    const scatter = filtered
      .filter(e => e.moodPolarity !== undefined && e.moodIntensity !== undefined)
      .map(e => ({
        id: e.id,
        date: new Date(e.createdAt),
        polarity: e.moodPolarity as number,
        intensity: e.moodIntensity as number,
        label: e.moodLabel
      }));

    return { filteredEntries: filtered, frequencyData: frequencyList, scatterData: scatter };
  }, [entries, dateRange]);

  // --- Frequency Chart Scales ---
  const freqWidth = 600;
  const freqHeight = 200;

  const xFreq = useMemo(() => {
    const dates = frequencyData.map(d => d.date);
    const domain = dates.length > 0 
      ? d3.extent(dates) as [Date, Date] 
      : [new Date(Date.now() - 30 * 86400000), new Date()];
    // Add padding to dates
    domain[0] = new Date(domain[0].getTime() - 86400000);
    domain[1] = new Date(domain[1].getTime() + 86400000);

    return d3.scaleTime()
      .domain(domain)
      .range([FREQ_MARGIN.left, freqWidth - FREQ_MARGIN.right]);
  }, [frequencyData]);

  const yFreq = useMemo(() => {
    const maxCount = d3.max(frequencyData, d => d.count) || 5;
    return d3.scaleLinear()
      .domain([0, maxCount])
      .range([freqHeight - FREQ_MARGIN.bottom, FREQ_MARGIN.top]);
  }, [frequencyData, freqHeight]);

  // --- Scatter Plot Scales ---
  const scatterSize = 400;

  const xScatter = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 10]) // Polarity: 0 to 10
      .range([SCATTER_MARGIN.left, scatterSize - SCATTER_MARGIN.right]);
  }, [scatterSize]);

  const yScatter = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 10]) // Intensity: 0 to 10
      .range([scatterSize - SCATTER_MARGIN.bottom, SCATTER_MARGIN.top]);
  }, [scatterSize]);

  const colorScale = useMemo(() => {
    // Map polarity to a diverging color scale (0 = red/negative, 5 = gray/neutral, 10 = green/blue/positive)
    return d3.scaleLinear<string>()
      .domain([0, 5, 10])
      .range(['#ef4444', '#a8a29e', '#10b981'])
      .clamp(true);
  }, []);

  if (loading) {
    return <div className="animate-pulse h-96 bg-secondary/30 rounded-xl" />;
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display text-foreground">Emotional Cadence & Patterns</h3>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value) as DateRange)}
          className="bg-card border border-border text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
          <option value={0}>All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Frequency Chart */}
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center">
          <h4 className="text-sm font-medium text-muted-foreground w-full mb-2 uppercase tracking-wider">Entry Frequency</h4>
          <p className="text-xs text-muted-foreground w-full mb-6 text-left">
            This chart tracks how often you journal over time. Consistency can reveal patterns in when you feel the most need to reflect. Use this to maintain momentum or spot periods of disengagement.
          </p>
          <div className="w-full max-w-lg aspect-[3/1]">
            <svg viewBox={`0 0 ${freqWidth} ${freqHeight}`} className="w-full h-full overflow-visible">
              {/* Axes Base Lines */}
              <line 
                x1={FREQ_MARGIN.left} 
                y1={freqHeight - FREQ_MARGIN.bottom} 
                x2={freqWidth - FREQ_MARGIN.right} 
                y2={freqHeight - FREQ_MARGIN.bottom} 
                stroke="currentColor" 
                className="text-border" 
                strokeWidth={2}
              />

              {/* Bars */}
              {frequencyData.map((d, i) => {
                const barWidth = Math.max(4, (freqWidth - FREQ_MARGIN.left - FREQ_MARGIN.right) / (dateRange || 180) * 0.8);
                const xPos = xFreq(d.date) - barWidth / 2;
                const yPos = yFreq(d.count);
                const barHeight = freqHeight - FREQ_MARGIN.bottom - yPos;

                return (
                  <g key={i}>
                    <rect
                      x={xPos}
                      y={yPos}
                      width={barWidth}
                      height={barHeight}
                      className="fill-primary/70 hover:fill-primary transition-colors cursor-pointer"
                      rx={2}
                    >
                      <title>{`${d.date.toDateString()}: ${d.count} entries`}</title>
                    </rect>
                    {d.count > 0 && (
                      <text x={xPos + barWidth / 2} y={yPos - 4} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                        {d.count}x
                      </text>
                    )}
                  </g>
                );
              })}
              {frequencyData.length === 0 && (
                <text x={freqWidth/2} y={freqHeight/2} textAnchor="middle" className="fill-muted-foreground text-sm">
                  No entries in this period
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* 2D Mood Scatter Plot */}
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center">
          <h4 className="text-sm font-medium text-muted-foreground w-full mb-2 uppercase tracking-wider">Mood Matrix</h4>
          <p className="text-xs text-muted-foreground w-full mb-6 text-left">
            Plots your entries based on emotional polarity (negative to positive) and intensity. It helps you quickly identify if you&apos;re experiencing extreme highs/lows or if your mood is generally stable.
          </p>
          <div className="w-full max-w-sm aspect-square relative">
            <svg viewBox={`0 0 ${scatterSize} ${scatterSize}`} className="w-full h-full overflow-visible">
              {/* Quadrant Backgrounds (Optional, subtle) */}
              <rect x={SCATTER_MARGIN.left} y={SCATTER_MARGIN.top} width={(scatterSize-SCATTER_MARGIN.left-SCATTER_MARGIN.right)/2} height={(scatterSize-SCATTER_MARGIN.top-SCATTER_MARGIN.bottom)/2} className="fill-red-500/5 dark:fill-red-500/10" />
              <rect x={SCATTER_MARGIN.left + (scatterSize-SCATTER_MARGIN.left-SCATTER_MARGIN.right)/2} y={SCATTER_MARGIN.top} width={(scatterSize-SCATTER_MARGIN.left-SCATTER_MARGIN.right)/2} height={(scatterSize-SCATTER_MARGIN.top-SCATTER_MARGIN.bottom)/2} className="fill-green-500/5 dark:fill-green-500/10" />
              <rect x={SCATTER_MARGIN.left} y={SCATTER_MARGIN.top + (scatterSize-SCATTER_MARGIN.top-SCATTER_MARGIN.bottom)/2} width={(scatterSize-SCATTER_MARGIN.left-SCATTER_MARGIN.right)/2} height={(scatterSize-SCATTER_MARGIN.top-SCATTER_MARGIN.bottom)/2} className="fill-orange-500/5 dark:fill-orange-500/10" />
              <rect x={SCATTER_MARGIN.left + (scatterSize-SCATTER_MARGIN.left-SCATTER_MARGIN.right)/2} y={SCATTER_MARGIN.top + (scatterSize-SCATTER_MARGIN.top-SCATTER_MARGIN.bottom)/2} width={(scatterSize-SCATTER_MARGIN.left-SCATTER_MARGIN.right)/2} height={(scatterSize-SCATTER_MARGIN.top-SCATTER_MARGIN.bottom)/2} className="fill-blue-500/5 dark:fill-blue-500/10" />

              {/* Axes lines */}
              <line x1={xScatter(5)} y1={SCATTER_MARGIN.top} x2={xScatter(5)} y2={scatterSize - SCATTER_MARGIN.bottom} stroke="currentColor" className="text-border" strokeDasharray="4 4" />
              <line x1={SCATTER_MARGIN.left} y1={yScatter(5)} x2={scatterSize - SCATTER_MARGIN.right} y2={yScatter(5)} stroke="currentColor" className="text-border" strokeDasharray="4 4" />

              {/* Axis Labels */}
              <text x={scatterSize / 2} y={scatterSize - 10} textAnchor="middle" className="fill-muted-foreground text-xs font-medium">Polarity (Negative → Positive)</text>
              <text x={-scatterSize / 2} y={15} transform="rotate(-90)" textAnchor="middle" className="fill-muted-foreground text-xs font-medium">Intensity (Mild → Intense)</text>

              {/* Data Points */}
              {scatterData.map(d => (
                <g key={d.id} className="group">
                  <circle
                    cx={xScatter(d.polarity)}
                    cy={yScatter(d.intensity)}
                    r={6}
                    fill={colorScale(d.polarity)}
                    className="opacity-70 group-hover:opacity-100 group-hover:stroke-foreground transition-all cursor-pointer"
                    strokeWidth={2}
                  >
                    <title>{`${d.date.toDateString()} | ${d.label || 'Unlabeled'}\nPolarity: ${d.polarity}, Intensity: ${d.intensity}`}</title>
                  </circle>
                  {d.label && (
                    <text 
                      x={xScatter(d.polarity) + 10} 
                      y={yScatter(d.intensity)} 
                      className="text-[10px] fill-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
                      alignmentBaseline="middle"
                    >
                      {d.label}
                    </text>
                  )}
                </g>
              ))}
              {scatterData.length === 0 && (
                <text x={scatterSize/2} y={scatterSize/2} textAnchor="middle" className="fill-muted-foreground text-sm">
                  No mood data in this period
                </text>
              )}
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
