/**
 * CollegeWeeklyMovers - Premium "This Week's Movers" module
 * Feels like a mini-game with momentum bars and delta strips
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Trophy, Target, TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { format } from 'date-fns';
import { CollegeBadge } from './CollegeBadge';
import { MomentumChip } from './MomentumChip';

type Direction = 'up' | 'down';

function formatDelta(delta: number, prefix = ''): string {
  const sign = delta >= 0 ? '+' : '';
  if (Math.abs(delta) >= 1_000_000) {
    return `${sign}${prefix}${(delta / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(delta) >= 1_000) {
    return `${sign}${prefix}${(delta / 1_000).toFixed(0)}K`;
  }
  return `${sign}${prefix}${Math.abs(delta).toLocaleString()}`;
}

interface CollegeWeeklyMoversProps {
  limit?: number;
  className?: string;
}

export function CollegeWeeklyMovers({ limit = 8, className }: CollegeWeeklyMoversProps) {
  const [direction, setDirection] = useState<Direction>('up');
  const { data: movers, isLoading } = useCollegeWeeklyMovers({ direction, limit });
  const { data: collegeMap } = useCollegeMediaMap();
  
  // Enrich movers with college media
  const enrichedMovers = useMemo(() => {
    if (!movers) return [];
    return movers.map(mover => ({
      ...mover,
      college: collegeMap?.get(mover.normalized_name) || mover.college || null,
    }));
  }, [movers, collegeMap]);
  
  // Get the week date for display
  const weekDate = movers?.[0]?.week_start 
    ? format(new Date(movers[0].week_start), 'MMMM d, yyyy')
    : null;

  // Calculate max earnings delta for momentum bar scaling
  const maxDelta = useMemo(() => {
    if (!enrichedMovers.length) return 1;
    return Math.max(...enrichedMovers.map(m => Math.abs(m.earnings_delta)));
  }, [enrichedMovers]);
  
  return (
    <div className={cn('', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-orange" />
          <h2 className="text-base font-semibold text-foreground">This Week's Movers</h2>
        </div>
        <button className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
          What changed?
        </button>
      </div>

      {/* Week context */}
      {weekDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Calendar className="w-3 h-3" />
          <span>Week of {weekDate}</span>
        </div>
      )}
      
      {/* Direction Tabs - Rising/Falling with color indicators */}
      <div 
        className="flex gap-2 mb-4"
        role="tablist"
        aria-label="Mover direction"
      >
        {[
          { value: 'up' as Direction, label: 'Rising', color: 'emerald' },
          { value: 'down' as Direction, label: 'Falling', color: 'rose' },
        ].map(({ value, label, color }) => {
          const isSelected = direction === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setDirection(value)}
              className={cn(
                "relative flex-1 px-4 py-2.5 text-sm font-medium rounded-sq-pill",
                "transition-all duration-200 ease-out",
                isSelected 
                  ? cn(
                      "bg-white dark:bg-white/10 shadow-sm ring-1",
                      value === 'up' 
                        ? "ring-emerald-200 dark:ring-emerald-800" 
                        : "ring-rose-200 dark:ring-rose-800"
                    )
                  : "bg-slate-100 dark:bg-white/5 text-muted-foreground hover:bg-slate-150"
              )}
            >
              <span className={cn(
                isSelected && value === 'up' && "text-emerald-600 dark:text-emerald-400",
                isSelected && value === 'down' && "text-rose-600 dark:text-rose-400",
              )}>
                {label}
              </span>
              {isSelected && (
                <div className={cn(
                  "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full",
                  value === 'up' ? "bg-emerald-500" : "bg-rose-500"
                )} />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Movers List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-sq-md bg-white/70 ring-1 ring-slate-200/60">
              <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
              <div className="w-12 h-12 rounded-sq-sm bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))
        ) : enrichedMovers && enrichedMovers.length > 0 ? (
          enrichedMovers.map((mover, idx) => {
            const displayName = mover.college?.short_name || mover.college?.college_name || mover.normalized_name;
            const momentumPercent = Math.min((Math.abs(mover.earnings_delta) / maxDelta) * 100, 100);
            
            return (
              <Link
                key={mover.id}
                to={`/tourhub/college-golf/${mover.normalized_name}`}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-sq-md overflow-hidden',
                  'bg-white/70 dark:bg-white/5',
                  'ring-1 ring-slate-200/60 dark:ring-white/8',
                  'hover:bg-white dark:hover:bg-white/8',
                  'active:scale-[0.995]',
                  'transition-all duration-150 ease-out group'
                )}
              >
                {/* Momentum bar background (very subtle) */}
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 opacity-[0.06] transition-all duration-300",
                    direction === 'up' ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  style={{ width: `${momentumPercent}%` }}
                />

                {/* Rank number */}
                <div className="relative shrink-0 w-6 text-center">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {idx + 1}
                  </span>
                </div>
                
                {/* College Badge */}
                <CollegeBadge
                  logoUrl={mover.college?.logo_url}
                  name={displayName}
                  size="sm"
                  variant="shield"
                />
                
                {/* Info */}
                <div className="relative flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {displayName}
                  </p>
                  
                  {/* Delta strip - compact and scannable */}
                  <div className="flex items-center gap-2 text-[11px] mt-1">
                    <span className={cn(
                      'inline-flex items-center gap-0.5 font-semibold',
                      mover.earnings_delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    )}>
                      <DollarSign className="w-2.5 h-2.5" />
                      {formatDelta(mover.earnings_delta, '')}
                    </span>
                    {mover.wins_delta !== 0 && (
                      <span className={cn(
                        'inline-flex items-center gap-0.5',
                        mover.wins_delta > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                      )}>
                        <Trophy className="w-2.5 h-2.5" />
                        {formatDelta(mover.wins_delta)}
                      </span>
                    )}
                    {mover.cuts_delta !== 0 && (
                      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                        <Target className="w-2.5 h-2.5" />
                        {formatDelta(mover.cuts_delta)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Rank Change Chip */}
                {mover.earnings_rank_change !== null && mover.earnings_rank_change !== 0 && (
                  <MomentumChip 
                    value={direction === 'up' ? Math.abs(mover.earnings_rank_change) : -Math.abs(mover.earnings_rank_change)} 
                    size="sm" 
                  />
                )}
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No {direction === 'up' ? 'rising' : 'falling'} colleges this week
          </div>
        )}
      </div>
    </div>
  );
}
