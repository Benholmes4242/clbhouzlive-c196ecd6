import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { CollegeCard } from './CollegeCard';

type MetricTab = 'earnings' | 'wins' | 'cuts' | 'top10s';

const METRIC_TABS: { value: MetricTab; label: string }[] = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'wins', label: 'Wins' },
  { value: 'cuts', label: 'Cuts' },
  { value: 'top10s', label: 'Top 10s' },
];

interface CollegeLeaderboardProps {
  limit?: number;
  className?: string;
}

export function CollegeLeaderboard({ limit = 25, className }: CollegeLeaderboardProps) {
  const [activeMetric, setActiveMetric] = useState<MetricTab>('earnings');
  const { data: allStats, isLoading, error } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  
  // Sort ALL colleges by selected metric, then take top N
  // This ensures correct leaderboard regardless of metric
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
      {/* Metric Tabs - Leaders page style with orange underline */}
      <div 
        className="flex justify-center mb-6"
        role="tablist"
        aria-label="College leaderboard metrics"
      >
        {METRIC_TABS.map(({ value, label }) => {
          const isSelected = activeMetric === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveMetric(value)}
              className={cn(
                "relative text-sm px-4 py-2 font-medium whitespace-nowrap",
                "bg-transparent border-0 shadow-none rounded-none",
                "transition-colors duration-200 ease-out",
                "inline-flex items-center justify-center",
                "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                "after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))]",
                "after:transition-all after:duration-200 after:ease-out",
                isSelected 
                  ? "text-foreground after:w-full after:opacity-[0.85]" 
                  : "text-muted-foreground hover:text-foreground after:w-0 after:opacity-0"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      
      {/* Leaderboard List */}
      <div className="space-y-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i}
              className="h-20 bg-surface-card border border-border-subtle rounded-sq-lg animate-pulse"
            />
          ))
        ) : error ? (
          <div className="text-center py-8 text-body-sm text-text-secondary">
            Failed to load leaderboard
          </div>
        ) : sortedStats.length > 0 ? (
          sortedStats.map((collegeStats, index) => (
            <CollegeCard
              key={collegeStats.normalized_name}
              stats={collegeStats}
              college={collegeMap?.get(collegeStats.normalized_name) || null}
              rank={index + 1}
            />
          ))
        ) : (
          <div className="text-center py-8 text-body-sm text-text-secondary">
            No colleges with stats this season
          </div>
        )}
      </div>
    </div>
  );
}
