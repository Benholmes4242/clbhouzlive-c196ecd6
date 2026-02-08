/**
 * FranchiseMovers - Enhanced weekly movers with Power Rankings style
 * Larger rank badges, animated fire emoji, reason chips + medallions
 */

import { useState, useRef, useEffect } from 'react';
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeButton = containerRef.current.querySelector(`[data-tab="${direction}"]`) as HTMLElement;
    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      setIndicatorStyle({ left: buttonRect.left - containerRect.left, width: buttonRect.width });
    }
  }, [direction]);

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
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70 mb-4">
          <CalendarDays className="w-3.5 h-3.5" />
          {weekLabel}
        </div>
      )}

      {/* Glass Bar Tabs */}
      <div className={cn("relative mb-6", "bg-background/60 backdrop-blur-md", "border border-border/40", "rounded-xl", "p-1")}>
        <div ref={containerRef} className="relative flex" role="tablist" aria-label="Mover direction">
          <motion.div
            className={cn("absolute bottom-0 h-[2px] rounded-full", "bg-[hsl(var(--tab-orange))]", "shadow-[0_0_8px_hsl(var(--tab-orange)/0.4)]")}
            initial={false}
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          {[
            { value: 'up' as Direction, label: 'Rising', icon: TrendingUp },
            { value: 'down' as Direction, label: 'Falling', icon: TrendingDown },
          ].map(({ value, label, icon: Icon }) => {
            const isSelected = direction === value;
            return (
              <button key={value} data-tab={value} role="tab" aria-selected={isSelected} onClick={() => setDirection(value)}
                className={cn("relative flex-1 px-3 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg flex items-center justify-center gap-1.5 active:scale-95", isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground/80")}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
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
                      'flex items-center gap-3 p-4 rounded-xl',
                      'bg-card/80 backdrop-blur-sm',
                      'border border-border/40',
                      'hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5',
                      'transition-all duration-200',
                      'group'
                    )}
                  >
                    {/* Large Rank Change Badge */}
                    <div className="shrink-0">
                      {mover.earnings_rank_change !== null && mover.earnings_rank_change !== 0 ? (
                        <motion.div
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, delay: idx * 0.04 + 0.1 }}
                          className={cn(
                            'w-11 h-11 rounded-full flex flex-col items-center justify-center text-xs font-bold',
                            mover.earnings_rank_change > 0
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
                          )}
                        >
                          <span className="text-sm leading-none">
                            {mover.earnings_rank_change > 0 ? '▲' : '▼'}
                          </span>
                          <span className="text-[11px] font-bold tabular-nums leading-none mt-0.5">
                            {Math.abs(mover.earnings_rank_change)}
                          </span>
                        </motion.div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-muted/40 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">—</span>
                        </div>
                      )}
                    </div>

                    {/* Logo */}
                    <div className="relative shrink-0">
                      <div className={cn("w-12 h-12 rounded-full bg-gradient-to-br from-background via-background to-muted/50 border border-border/60 shadow-inner flex items-center justify-center overflow-hidden")}>
                        {mover.college?.logo_url ? (
                          <img src={mover.college.logo_url} alt={displayName} className="w-9 h-9 object-contain" loading="lazy" />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground/60">{displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      {/* Animated fire emoji for hot streaks */}
                      {isHotStreak && (
                        <span className="absolute -top-1 -right-1 text-sm animate-flame">🔥</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
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

                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
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
