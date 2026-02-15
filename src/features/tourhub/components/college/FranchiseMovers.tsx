/**
 * FranchiseMovers - Weekly movers using unified FranchiseCard layout
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useCollegeStatusMap } from '../../hooks/useCollegeStatus';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useBatchCollegeAlumni } from '../../hooks/useBatchCollegeAlumni';
import { FranchiseCard } from './FranchiseCard';
import { format } from 'date-fns';

type Direction = 'up' | 'down';

interface FranchiseMoversProps {
  limit?: number;
  className?: string;
}

export function FranchiseMovers({ limit = 8, className }: FranchiseMoversProps) {
  const [direction, setDirection] = useState<Direction>('up');
  const { data: movers, isLoading } = useCollegeWeeklyMovers({ direction, limit });
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: allStats } = useCollegeSeasonStats();
  const statusMap = useCollegeStatusMap();

  // Build a lookup for season stats by normalized_name
  const statsMap = useMemo(() => {
    if (!allStats) return new Map();
    return new Map(allStats.map(s => [s.normalized_name, s]));
  }, [allStats]);

  const enrichedMovers = (movers || []).map(mover => ({
    ...mover,
    college: collegeMap?.get(mover.normalized_name) || mover.college || null,
    stats: statsMap.get(mover.normalized_name) || null,
  }));

  // Batch alumni
  const slugs = useMemo(() => enrichedMovers.map(m => m.normalized_name), [enrichedMovers]);
  const { data: alumniMap } = useBatchCollegeAlumni(slugs, 3);

  const weekStart = movers?.[0]?.week_start;
  const weekLabel = weekStart
    ? (() => {
        const start = new Date(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `Week of ${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      })()
    : null;

  return (
    <div className={cn('', className)}>
      {weekLabel && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-3">
          <CalendarDays className="w-3.5 h-3.5" />
          {weekLabel}
        </div>
      )}

      {/* Rising / Falling toggle — keep existing segmented style */}
      <div className="flex items-stretch rounded-xl overflow-hidden bg-secondary mb-3">
        {[
          { value: 'up' as Direction, label: 'Rising', icon: TrendingUp },
          { value: 'down' as Direction, label: 'Falling', icon: TrendingDown },
        ].map(({ value, label, icon: Icon }) => {
          const isSelected = direction === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setDirection(value)}
              className={cn(
                "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98] flex items-center justify-center gap-1.5",
                isSelected
                  ? "bg-card text-foreground shadow-sm m-1 rounded-lg"
                  : "text-muted-foreground hover:text-foreground rounded-lg active:bg-card/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Movers List — uses unified FranchiseCard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={direction}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[110px] bg-card/50 border border-border/30 rounded-xl animate-pulse" />
            ))
          ) : enrichedMovers.length > 0 ? (
            enrichedMovers.map((mover, idx) => {
              if (!mover.stats) return null;
              const alumni = alumniMap?.get(mover.normalized_name) || undefined;

              return (
                <FranchiseCard
                  key={mover.id}
                  stats={mover.stats}
                  college={mover.college}
                  activeMetric="earnings"
                  alumni={alumni}
                  animationDelay={idx * 0.03}
                  isDelta
                  deltas={{
                    earnings_delta: mover.earnings_delta,
                    wins_delta: mover.wins_delta,
                    cuts_delta: mover.cuts_delta,
                    top10_delta: mover.top10_delta,
                    earnings_rank_change: mover.earnings_rank_change,
                  }}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm font-medium text-foreground mb-1">No movement this week</p>
              <p className="text-xs text-muted-foreground">Check back after the next tournament.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
