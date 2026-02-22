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

  const statsMap = useMemo(() => {
    if (!allStats) return new Map();
    return new Map(allStats.map(s => [s.normalized_name, s]));
  }, [allStats]);

  const enrichedMovers = (movers || []).map(mover => ({
    ...mover,
    college: collegeMap?.get(mover.normalized_name) || mover.college || null,
    stats: statsMap.get(mover.normalized_name) || null,
  }));

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
        <div className="flex items-center gap-1.5 text-muted-foreground/50 uppercase mb-3" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.8px' }}>
          <CalendarDays className="w-3.5 h-3.5" />
          {weekLabel}
        </div>
      )}

      {/* Rising / Falling toggle — rounded-2xl container */}
      <div
        className="flex items-stretch overflow-hidden"
        style={{
          borderRadius: 16,
          background: 'hsl(var(--muted) / 0.3)',
          border: '1px solid hsl(var(--border) / 0.5)',
          padding: 4,
          marginBottom: 12,
        }}
      >
        {[
          { value: 'up' as Direction, label: 'Rising', icon: TrendingUp, iconColor: '#22C55E' },
          { value: 'down' as Direction, label: 'Falling', icon: TrendingDown, iconColor: '#EF4444' },
        ].map(({ value, label, icon: Icon, iconColor }) => {
          const isSelected = direction === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setDirection(value)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] transition-all duration-200',
              )}
              style={{
                borderRadius: 12,
                padding: 10,
                minHeight: 44,
                fontSize: 14,
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                background: isSelected ? 'hsl(var(--card))' : 'transparent',
                boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Movers List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={direction}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col"
          style={{ gap: 10 }}
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card/50 border border-border/30 animate-pulse" style={{ height: 110, borderRadius: 16 }} />
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
            <div className="flex flex-col items-center text-center" style={{ paddingTop: 32 }}>
               <p style={{ fontSize: 16, fontWeight: 600 }} className="text-foreground/60">No movement this week</p>
               <p style={{ fontSize: 13, fontWeight: 400, marginTop: 4 }} className="text-muted-foreground">Movers update every Monday based on weekly ranking changes.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
