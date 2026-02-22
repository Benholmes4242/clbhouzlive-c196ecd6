/**
 * FranchiseLeaderboard - Premium college leaderboard
 * Simple text tabs with underline active state
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useCollegeStatusMap, useTopMovers } from '../../hooks/useCollegeStatus';
import { useBatchCollegeAlumni } from '../../hooks/useBatchCollegeAlumni';
import { FranchiseCard } from './FranchiseCard';
import { FranchiseMovers } from './FranchiseMovers';

type MetricTab = 'earnings' | 'wins' | 'cuts' | 'top10s' | 'movers';

const METRIC_TABS: { value: MetricTab; label: string }[] = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'wins', label: 'Wins' },
  { value: 'cuts', label: 'Cuts' },
  { value: 'top10s', label: 'Top 10s' },
  { value: 'movers', label: 'Movers' },
];

const VALID_METRICS = new Set<string>(['earnings', 'wins', 'cuts', 'top10s', 'movers']);

interface FranchiseLeaderboardProps {
  limit?: number;
  className?: string;
}

export function FranchiseLeaderboard({ limit = 25, className }: FranchiseLeaderboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const activeMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';

  const setActiveMetric = (metric: MetricTab) => {
    const params = new URLSearchParams(searchParams);
    if (metric === 'earnings') params.delete('sort');
    else params.set('sort', metric);
    setSearchParams(params, { replace: true });
  };

  const { data: allStats, isLoading, error } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const statusMap = useCollegeStatusMap();
  const { data: moverInfo } = useTopMovers();

  const { sortedStats, maxValue } = useMemo(() => {
    if (!allStats) return { sortedStats: [], maxValue: 1 };
    const getValue = (s: CollegeSeasonStats) => {
      switch (activeMetric) {
        case 'wins': return s.wins_total;
        case 'cuts': return s.cuts_total;
        case 'top10s': return s.top10_total;
        default: return s.earnings_total;
      }
    };
    const sorted = [...allStats].sort((a, b) => getValue(b) - getValue(a)).slice(0, limit);
    const max = sorted.length > 0 ? getValue(sorted[0]) : 1;
    return { sortedStats: sorted, maxValue: max };
  }, [allStats, activeMetric, limit]);

  const collegeSlugs = useMemo(() => sortedStats.map(s => s.normalized_name), [sortedStats]);
  const { data: alumniMap } = useBatchCollegeAlumni(collegeSlugs, 3);

  return (
    <div className={cn('', className)}>
      {/* Tabs — underline style, 4-column even, 14px */}
      <div
        role="tablist"
        aria-label="Franchise Leaderboard Sort"
        style={{
          borderBottom: '1px solid hsl(var(--border) / 0.1)',
          marginBottom: 12,
        }}
      >
        <div className="flex">
          {METRIC_TABS.map(({ value, label }) => {
            const isSelected = activeMetric === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveMetric(value)}
                className={cn(
                  'relative flex-1 whitespace-nowrap active:scale-[0.98] transition-colors duration-200',
                  isSelected
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 500,
                  paddingBottom: 10,
                  minHeight: 40,
                }}
              >
                {label}
                {isSelected && (
                  <motion.div
                    layoutId="franchise-tab-underline"
                    className="absolute bottom-0 left-1/4 right-1/4 bg-foreground rounded-full"
                    style={{ height: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeMetric === 'movers' ? (
        <FranchiseMovers />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMetric}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
            style={{ gap: 10 }}
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card/50 border border-border/30 animate-pulse" style={{ height: 110, borderRadius: 16 }} />
              ))
            ) : error ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Failed to load leaderboard</div>
            ) : sortedStats.length > 0 ? (
              sortedStats.map((collegeStats, index) => {
                const status = statusMap.get(collegeStats.normalized_name) || null;
                const moverData = moverInfo?.moverData?.get(collegeStats.normalized_name);
                const momentum = moverData ? {
                  rankChange: moverData.rankChange,
                  earningsDelta: moverData.earningsDelta,
                  isRising: moverData.earningsDelta > 0 || (moverData.rankChange !== null && moverData.rankChange > 0),
                } : null;
                const alumni = alumniMap?.get(collegeStats.normalized_name) || undefined;

                return (
                  <FranchiseCard
                    key={collegeStats.normalized_name}
                    stats={collegeStats}
                    college={collegeMap?.get(collegeStats.normalized_name) || null}
                    rank={index + 1}
                    maxValue={maxValue}
                    activeMetric={activeMetric}
                    status={status}
                    momentum={momentum}
                    alumni={alumni}
                    animationDelay={index * 0.03}
                  />
                );
              })
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <Loader2 className="w-5 h-5 text-muted-foreground/50 animate-spin mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Season stats are being calculated</p>
                <p className="text-xs text-muted-foreground">Check back soon.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
