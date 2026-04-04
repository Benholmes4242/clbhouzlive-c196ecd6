/**
 * FranchiseLeaderboard - Premium college leaderboard
 * Simple text tabs with underline active state
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useTopMovers } from '../../hooks/useCollegeStatus';
import { useBatchCollegeAlumni } from '../../hooks/useBatchCollegeAlumni';
import { FranchiseCard } from './FranchiseCard';
import { FranchiseMovers } from './FranchiseMovers';

type MetricTab = 'earnings' | 'wins' | 'top10s' | 'movers';

const METRIC_TABS: { value: MetricTab; label: string }[] = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'wins', label: 'Wins' },
  { value: 'top10s', label: 'Top 10s' },
  { value: 'movers', label: 'Movers' },
];

const VALID_METRICS = new Set<string>(['earnings', 'wins', 'top10s', 'movers']);

interface FranchiseLeaderboardProps {
  limit?: number;
  className?: string;
  /** When provided, parent controls the active metric — tabs are hidden */
  activeMetric?: MetricTab;
  onMetricChange?: (metric: MetricTab) => void;
  /** When true, suppress the sticky tab header (parent renders it instead) */
  hideHeader?: boolean;
}

export function FranchiseLeaderboard({ limit = 25, className, activeMetric: externalMetric, onMetricChange, hideHeader = false }: FranchiseLeaderboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const internalMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';

  // Use external control if provided, otherwise internal URL state
  const activeMetric = externalMetric ?? internalMetric;

  const setActiveMetric = (metric: MetricTab) => {
    if (onMetricChange) {
      onMetricChange(metric);
    } else {
      const params = new URLSearchParams(searchParams);
      if (metric === 'earnings') params.delete('sort');
      else params.set('sort', metric);
      setSearchParams(params, { replace: true });
    }
  };

  const { data: allStats, isLoading, error } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: moverInfo } = useTopMovers();

  const { sortedStats, maxValue } = useMemo(() => {
    if (!allStats) return { sortedStats: [], maxValue: 1 };
    const getValue = (s: CollegeSeasonStats) => {
      switch (activeMetric) {
        case 'wins': return s.wins_total;
        case 'top10s': return s.top10_total;
        default: return s.earnings_total;
      }
    };
    const sorted = [...allStats]
      .sort((a, b) => {
        const diff = getValue(b) - getValue(a);
        if (diff !== 0) return diff;
        if (activeMetric === 'wins' || activeMetric === 'top10s') return b.earnings_total - a.earnings_total;
        return b.wins_total - a.wins_total;
      })
      .filter(s => (activeMetric === 'wins' || activeMetric === 'top10s') ? getValue(s) > 0 : true)
      .slice(0, limit);
    const max = sorted.length > 0 ? getValue(sorted[0]) : 1;
    return { sortedStats: sorted, maxValue: max };
  }, [allStats, activeMetric, limit]);

  const collegeSlugs = useMemo(() => sortedStats.map(s => s.normalized_name), [sortedStats]);
  const { data: alumniMap } = useBatchCollegeAlumni(collegeSlugs, 3);

  return (
    <div className={cn('', className)}>
      {/* Tabs — only rendered when parent hasn't taken over (hideHeader = false) */}
      {!hideHeader && (
        <div
          className="sticky top-0 z-20 -mx-4 px-4"
          style={{
            background: 'hsl(var(--background) / 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
            paddingBottom: 8,
            marginBottom: 16,
            borderBottom: '1px solid hsl(var(--border) / 0.15)',
          }}
        >
          <div
            role="tablist"
            aria-label="Franchise Leaderboard Sort"
            className="flex rounded-xl"
            style={{
              background: 'transparent',
              padding: 4,
            }}
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
                    'relative flex-1 whitespace-nowrap rounded-lg active:scale-[0.98] transition-all duration-200',
                    isSelected
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted/50'
                  )}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    minHeight: 44,
                    padding: '10px 4px',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
            style={{ gap: 8 }}
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-muted/40 animate-pulse" style={{ minHeight: 110, borderRadius: 16 }} />
              ))
            ) : error ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Failed to load leaderboard</div>
            ) : sortedStats.length > 0 ? (
              <>
                {sortedStats.map((collegeStats, index) => {
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
                      momentum={momentum}
                      alumni={alumni}
                      animationDelay={index * 0.03}
                    />
                  );
                })}
                {(activeMetric === 'wins' || activeMetric === 'top10s') && (
                  <p
                    style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', marginTop: 8 }}
                    className="text-muted-foreground/50"
                  >
                    {sortedStats.length} {sortedStats.length === 1 ? 'franchise' : 'franchises'} with {activeMetric === 'wins' ? 'wins' : 'top 10s'} this season
                  </p>
                )}
              </>
            ) : activeMetric === 'wins' ? (
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-sm font-medium text-foreground mb-1">No wins yet this season</p>
                <p className="text-xs text-muted-foreground">Check back as the season progresses.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-sm font-medium text-foreground mb-1">No data available</p>
                <p className="text-xs text-muted-foreground">Season stats are being calculated. Check back soon.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
