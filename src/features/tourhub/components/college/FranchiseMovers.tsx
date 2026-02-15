/**
 * FranchiseMovers - Weekly movers with segmented control tabs
 * Aligned with Tour Hub design language
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Trophy, Target, ChevronRight, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useCollegeStatusMap } from '../../hooks/useCollegeStatus';
import { format } from 'date-fns';

type Direction = 'up' | 'down';

function formatDelta(delta: number, prefix = ''): string {
  const sign = delta >= 0 ? '+' : '';
  if (Math.abs(delta) >= 1_000_000) return `${sign}${prefix}${(delta / 1_000_000).toFixed(1)}M`;
  if (Math.abs(delta) >= 1_000) return `${sign}${prefix}${(delta / 1_000).toFixed(0)}K`;
  return `${sign}${prefix}${Math.abs(delta).toLocaleString()}`;
}

interface FranchiseMoversProps {
  limit?: number;
  className?: string;
}

export function FranchiseMovers({ limit = 8, className }: FranchiseMoversProps) {
  const [direction, setDirection] = useState<Direction>('up');
  const { data: movers, isLoading } = useCollegeWeeklyMovers({ direction, limit });
  const { data: collegeMap } = useCollegeMediaMap();
  const statusMap = useCollegeStatusMap();

  const enrichedMovers = (movers || []).map(mover => ({
    ...mover,
    college: collegeMap?.get(mover.normalized_name) || mover.college || null,
  }));

  const weekStart = movers?.[0]?.week_start;
  const weekLabel = weekStart
    ? (() => {
        const start = new Date(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `Week of ${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
      })()
    : null;

  return (
    <div className={cn('', className)}>
      {weekLabel && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-4">
          <CalendarDays className="w-3.5 h-3.5" />
          {weekLabel}
        </div>
      )}

      {/* Segmented Control — matches Course Detail / Franchise Leaderboard style */}
      <div className="flex items-stretch rounded-xl overflow-hidden bg-secondary mb-5">
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

      {/* Movers List */}
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
              <div key={i} className="h-[88px] bg-card/50 border border-border/30 rounded-xl animate-pulse" />
            ))
          ) : enrichedMovers.length > 0 ? (
            enrichedMovers.map((mover, idx) => {
              const displayName = mover.college?.short_name || mover.college?.college_name || mover.normalized_name;
              const status = statusMap.get(mover.normalized_name);
              const isHotStreak = status?.type === 'hotStreak';

              return (
                <motion.div
                  key={mover.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={`/tourhub/college-golf/${mover.normalized_name}`}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl',
                      'bg-card',
                      'border border-border/30',
                      'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                      'transition-all duration-200',
                      'group'
                    )}
                  >
                    {/* Rank Change Badge */}
                    <div className="shrink-0">
                      {mover.earnings_rank_change !== null && mover.earnings_rank_change !== 0 ? (
                        <motion.div
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, delay: idx * 0.04 + 0.1 }}
                          className={cn(
                            'w-11 h-11 flex flex-col items-center justify-center text-xs font-bold',
                            mover.earnings_rank_change > 0
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
                          )}
                          style={{ borderRadius: '34%' }}
                        >
                          <span className="text-sm leading-none">
                            {mover.earnings_rank_change > 0 ? '▲' : '▼'}
                          </span>
                          <span className="text-[11px] font-bold tabular-nums leading-none mt-0.5">
                            {Math.abs(mover.earnings_rank_change)}
                          </span>
                        </motion.div>
                      ) : (
                        <div className="w-11 h-11 bg-muted/40 flex items-center justify-center" style={{ borderRadius: '34%' }}>
                          <span className="text-xs text-muted-foreground">—</span>
                        </div>
                      )}
                    </div>

                    {/* Logo — squircle */}
                    <div className="relative shrink-0">
                      <div
                        className="w-12 h-12 bg-gradient-to-br from-background via-background to-muted/50 border border-border/60 shadow-inner flex items-center justify-center overflow-hidden"
                        style={{ borderRadius: '34%' }}
                      >
                        {mover.college?.logo_url ? (
                          <img src={mover.college.logo_url} alt={displayName} className="w-9 h-9 object-contain" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
                        )}
                      </div>
                      {/* Hot streak indicator */}
                      {isHotStreak && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                          <TrendingUp className="w-2.5 h-2.5 text-orange-500" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                        {displayName}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', mover.earnings_delta >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
                          <DollarSign className="w-3 h-3" />
                          {formatDelta(mover.earnings_delta, '$')}
                        </span>
                        {mover.wins_delta !== 0 && (
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', mover.wins_delta > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
                            <Trophy className="w-3 h-3" />
                            {formatDelta(mover.wins_delta)} win{Math.abs(mover.wins_delta) !== 1 ? 's' : ''}
                          </span>
                        )}
                        {mover.cuts_delta !== 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            <Target className="w-3 h-3" />
                            {formatDelta(mover.cuts_delta)} cut{Math.abs(mover.cuts_delta) !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                </motion.div>
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
