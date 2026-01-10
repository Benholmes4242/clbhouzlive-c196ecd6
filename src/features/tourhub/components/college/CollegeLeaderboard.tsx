import { useState, useMemo } from 'react';
import { Trophy, DollarSign, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { CollegeCard } from './CollegeCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MetricTab = 'earnings' | 'wins' | 'cuts' | 'top10s';

const METRIC_TABS: { value: MetricTab; label: string; icon: React.ElementType }[] = [
  { value: 'earnings', label: 'Earnings', icon: DollarSign },
  { value: 'wins', label: 'Wins', icon: Trophy },
  { value: 'cuts', label: 'Cuts Made', icon: Target },
  { value: 'top10s', label: 'Top 10s', icon: TrendingUp },
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
      {/* Metric Tabs */}
      <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricTab)}>
        <TabsList className="w-full grid grid-cols-4 mb-4">
          {METRIC_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger 
              key={value} 
              value={value}
              className="text-xs sm:text-sm flex items-center gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
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
