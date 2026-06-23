'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import { JournalEntry } from '@/types/journal';
import { logStreakMilestone } from '@/lib/analytics/client';

const MILESTONES = [3, 7, 14, 30, 50, 100, 365];

// Helper to get local YYYY-MM-DD
function toLocalISODate(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
}

// 0 = Morning, 1 = Afternoon, 2 = Evening, 3 = Night
function getTimeOfDay(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 0; // Morning
  if (hour >= 12 && hour < 17) return 1; // Afternoon
  if (hour >= 17 && hour < 21) return 2; // Evening
  return 3; // Night
}

export function StreakCalendar() {
  const { user } = useAuth();
  const { data: entries, loading } = useFirestore<JournalEntry>(
    user ? `users/${user.uid}/entries` : '',
    orderBy('createdAt', 'desc')
  );

  const [milestoneLogged, setMilestoneLogged] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Group and compute metrics
  const { 
    calendarData, 
    timeOfWeekData, 
    currentStreak, 
    longestStreak 
  } = useMemo(() => {
    if (!entries) return { calendarData: new Map(), timeOfWeekData: [], currentStreak: 0, longestStreak: 0 };

    const dates = entries.map(e => new Date(e.createdAt));
    const dateCounts = new Map<string, number>();
    
    // Time of week matrix: 7 days x 4 times
    // Rows: Mon=0, Tue=1 ... Sun=6 (to match standard start-of-week logic in UI usually)
    // Wait, JS getDay(): Sun=0, Mon=1. Let's map Sun=6, Mon=0, Tue=1...
    const timeMatrix = Array.from({ length: 7 }, () => [0, 0, 0, 0]);

    for (const d of dates) {
      const iso = toLocalISODate(d);
      dateCounts.set(iso, (dateCounts.get(iso) || 0) + 1);

      const dayIdx = (d.getDay() + 6) % 7; // Map Sun(0)->6, Mon(1)->0
      const timeIdx = getTimeOfDay(d);
      timeMatrix[dayIdx][timeIdx]++;
    }

    // Streak Calculation
    let current = 0;
    let longest = 0;
    const tempStreak = 0;
    
    // Sort unique dates descending
    const uniqueDates = Array.from(dateCounts.keys()).sort((a, b) => b.localeCompare(a));
    
    if (uniqueDates.length > 0) {
      const todayIso = toLocalISODate(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = toLocalISODate(yesterday);

      let expectedDate = new Date();
      
      // If no entry today, see if we have one yesterday. 
      // If neither, current streak is 0.
      if (!dateCounts.has(todayIso)) {
        if (dateCounts.has(yesterdayIso)) {
          expectedDate = yesterday;
        } else {
          current = 0;
        }
      }

      // Calculate current streak
      if (current !== 0 || dateCounts.has(todayIso) || dateCounts.has(yesterdayIso)) {
        const checkingDate = new Date(expectedDate);
        while (true) {
          const iso = toLocalISODate(checkingDate);
          if (dateCounts.has(iso)) {
            current++;
            checkingDate.setDate(checkingDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      // A streak breaks if there is >1 day gap between entries
      let maxSoFar = 1;
      let currSoFar = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = new Date(uniqueDates[i]);
        const d2 = new Date(uniqueDates[i+1]);
        const diffTime = Math.abs(d1.getTime() - d2.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currSoFar++;
          maxSoFar = Math.max(maxSoFar, currSoFar);
        } else {
          currSoFar = 1;
        }
      }
      longest = Math.max(maxSoFar, current);
      if (uniqueDates.length === 1) longest = 1;
    }

    return { calendarData: dateCounts, timeOfWeekData: timeMatrix, currentStreak: current, longestStreak: longest };
  }, [entries]);

  // Handle milestone analytics
  useEffect(() => {
    if (currentStreak === 0 || !user) return;

    // Check if current streak qualifies for a milestone
    const threshold = MILESTONES.slice().reverse().find(m => currentStreak >= m);
    if (!threshold) return;

    const storageKey = `ygg_milestone_${user.uid}`;
    const lastLogged = parseInt(localStorage.getItem(storageKey) || '0', 10);

    if (threshold > lastLogged) {
      logStreakMilestone({ streak_days: threshold });
      localStorage.setItem(storageKey, threshold.toString());
      setMilestoneLogged(threshold);
    }
  }, [currentStreak, user]);

  // Generate 52-week calendar grid
  const calendarGrid = useMemo(() => {
    const today = new Date();
    // Start exactly 52 weeks ago (364 days)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    // Adjust start date to the nearest Sunday to keep weeks aligned
    // Optional, but helps standard GitHub layout where columns are Sun-Sat
    const dayOffset = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOffset);

    const weeks = [];
    const currDate = new Date(startDate);
    
    // We render up to today + the rest of the current week
    while (currDate <= today || currDate.getDay() !== 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const iso = toLocalISODate(currDate);
        const count = calendarData.get(iso) || 0;
        week.push({ date: new Date(currDate), iso, count, isFuture: currDate > today });
        currDate.setDate(currDate.getDate() + 1);
      }
      weeks.push(week);
      if (currDate > today && currDate.getDay() === 0) break;
    }
    return weeks;
  }, [calendarData]);

  // Scroll to the rightmost edge by default so user sees the current week
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollLeft = container.scrollWidth;
    }
  }, [calendarGrid]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-secondary/30 rounded-xl" />;
  }

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-surface-2';
    if (count === 1) return 'bg-emerald-500/40';
    if (count === 2) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  const getMatrixIntensityClass = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-surface-2';
    const ratio = count / (maxCount || 1);
    if (ratio <= 0.25) return 'bg-emerald-500/30';
    if (ratio <= 0.5) return 'bg-emerald-500/50';
    if (ratio <= 0.75) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  const maxTimeMatrixCount = Math.max(...timeOfWeekData.flat());
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeNames = ['Morning', 'Afternoon', 'Evening', 'Night'];

  return (
    <div className="space-y-8">
      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Current Streak</p>
          <div className="text-4xl font-display text-foreground flex items-center justify-center gap-2">
            <span className="text-amber-500">🔥</span>
            {currentStreak} <span className="text-lg text-muted-foreground font-sans lowercase">days</span>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Longest Streak</p>
          <div className="text-4xl font-display text-foreground flex items-center justify-center gap-2">
            <span className="text-emerald-500">✨</span>
            {longestStreak} <span className="text-lg text-muted-foreground font-sans lowercase">days</span>
          </div>
        </div>
      </div>

      {milestoneLogged && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>🎉</span> 
          <span>Incredible! You reached a <strong>{milestoneLogged}-day</strong> journaling milestone. Keep it up!</span>
        </div>
      )}

      {/* Heatmaps Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Heatmap */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-medium mb-1">Consistency Map</h3>
          <p className="text-xs text-muted-foreground w-full mb-6 text-left">
            A visual record of your daily journaling habit over the past year. Darker squares indicate days with multiple entries. Building a dense, uninterrupted map helps solidify your reflection habit.
          </p>
          <div className="overflow-x-auto pb-4" ref={scrollContainerRef}>
            <div className="flex gap-1 min-w-max">
              {calendarGrid.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      title={day.isFuture ? '' : `${day.iso}: ${day.count} entries`}
                      className={`w-3 h-3 rounded-sm ${day.isFuture ? 'opacity-0' : getIntensityClass(day.count)} transition-colors duration-200 hover:ring-1 hover:ring-primary`}
                    />
                  ))}
                </div>
              ))}
            </div>
            {/* Month labels approximation could go here, but omitted for simplicity */}
          </div>
        </div>

        {/* Day/Time Heatmap */}
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-medium mb-1">When You Write</h3>
          <p className="text-xs text-muted-foreground w-full mb-6 text-left">
            Shows your preferred times for reflection throughout the week. Recognizing these patterns can help you intentionally schedule deep-thinking time when you naturally have the most energy.
          </p>
          
          <div className="grid grid-cols-5 gap-1 mb-2">
            <div className="text-[10px] text-muted-foreground"></div>
            {timeNames.map((t, i) => (
              <div key={i} className="text-[10px] text-muted-foreground text-center writing-mode-vertical truncate" title={t}>
                {t.slice(0,3)}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {timeOfWeekData.map((dayCounts, dIdx) => (
              <div key={dIdx} className="grid grid-cols-5 gap-1 items-center">
                <div className="text-[10px] text-muted-foreground font-medium text-right pr-2">
                  {dayNames[dIdx]}
                </div>
                {dayCounts.map((count, tIdx) => (
                  <div
                    key={tIdx}
                    title={`${dayNames[dIdx]} ${timeNames[tIdx]}: ${count} entries`}
                    className={`h-6 rounded-sm ${getMatrixIntensityClass(count, maxTimeMatrixCount)} transition-colors duration-200`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
