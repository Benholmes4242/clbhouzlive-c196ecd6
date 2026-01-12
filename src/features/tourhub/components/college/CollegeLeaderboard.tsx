/**
 * CollegeLeaderboard - Premium college rankings with competition hub feel
 * Sticky tabs, helper descriptions, team-style cards
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Info } from 'lucide-react';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { CollegeCard } from './CollegeCard';

type MetricTab = 'earnings' | 'wins' | 'cuts' | 'top10s';

const METRIC_TABS: { value: MetricTab; label: string; helper: string }[] = [
  { value: 'earnings', label: 'Earnings', helper: 'Total prize money earned by alumni' },
  { value: 'wins', label: 'Wins', helper: 'Tournament wins by alumni' },
  { value: 'cuts', label: 'Cuts', helper: 'Cuts made by alumni' },
  { value: 'top10s', label: 'Top 10s', helper: 'Top 10 finishes by alumni' },
];

interface CollegeLeaderboardProps {
  limit?: number;
  className?: string;
}

export function CollegeLeaderboard({ limit = 25, className }: CollegeLeaderboardProps) {
  const [activeMetric, setActiveMetric] = useState<MetricTab>('earnings');
  const { data: allStats, isLoading, error } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  
  const activeTab = METRIC_TABS.find(t => t.value === activeMetric)!;
  
  // Sort ALL colleges by selected metric, then take top N
  const sortedStats = useMemo(() => {
    if (!allStats) return [];
    
    const getValue = (s: CollegeSeasonStats) => {
      switch (activeMetric) {
        case 'wins': return s.wins_total;
        case 'cuts': return s.cuts_total;
        case 'top10s': return s.top10_total;
        default: return s.earnings_total;
      }
    };
    
    return [...allStats]
      .sort((a, b) => getValue(b) - getValue(a))
      .slice(0, limit);
  }, [allStats, activeMetric, limit]);
  
  return (
    <div className={cn('', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-orange" />
          <h2 className="text-base font-semibold text-foreground">College Leaderboards</h2>
        </div>
        <button className="p-1.5 rounded-full hover:bg-muted/50 transition-colors">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4">
        2025 Season rankings by total alumni performance
      </p>

      {/* Metric Tabs - Sticky with premium styling */}
      <div 
        className="sticky top-[var(--header-h-mobile,44px)] z-10 bg-white/90 dark:bg-background/90 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border/30"
        role="tablist"
        aria-label="College leaderboard metrics"
      >
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {METRIC_TABS.map(({ value, label }) => {
            const isSelected = activeMetric === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveMetric(value)}
                className={cn(
                  "relative flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-sq-pill",
                  "transition-all duration-200 ease-out",
                  isSelected 
                    ? "bg-white dark:bg-white/10 shadow-sm ring-1 ring-slate-200 dark:ring-white/10 text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-white/5"
                )}
              >
                {label}
                {isSelected && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-brand-orange" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Tab helper text */}
      <p className="text-xs text-muted-foreground mt-3 mb-4 px-0.5">
        {activeTab.helper}
      </p>
      
      {/* Leaderboard List */}
      <div className="space-y-2">
        {isLoading ? (
          // Premium loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-4 rounded-sq-md bg-white/70 dark:bg-white/5 ring-1 ring-slate-200/60 dark:ring-white/8"
            >
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              <div className="w-14 h-14 rounded-sq-sm bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-48 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Failed to load leaderboard
          </div>
        ) : sortedStats.length > 0 ? (
          sortedStats.map((collegeStats, index) => (
            <CollegeCard
              key={collegeStats.normalized_name}
              stats={collegeStats}
              college={collegeMap?.get(collegeStats.normalized_name) || null}
              rank={index + 1}
              showMomentum={false}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No colleges with stats this season</p>
            <div className="flex justify-center gap-2 mt-3">
              {['Texas', 'Georgia', 'Stanford'].map(name => (
                <span key={name} className="px-3 py-1 rounded-sq-pill bg-muted text-xs text-muted-foreground">
                  Try "{name}"
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
