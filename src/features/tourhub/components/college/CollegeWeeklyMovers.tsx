import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { format } from 'date-fns';

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
  
  // Enrich movers with college media (ensures logos load even if media loads after movers)
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
  
  return (
    <div className={cn('', className)}>
      {/* Week context */}
      {weekDate && (
        <p className="text-body-sm text-text-secondary mb-4">
          Week of {weekDate}
        </p>
      )}
      
      {/* Direction Tabs - Leaders page style with orange underline */}
      <div 
        className="flex justify-center mb-6"
        role="tablist"
        aria-label="Mover direction"
      >
        {[
          { value: 'up' as Direction, label: 'Rising' },
          { value: 'down' as Direction, label: 'Falling' },
        ].map(({ value, label }) => {
          const isSelected = direction === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setDirection(value)}
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
      
      {/* Movers List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-surface-card border border-border-subtle rounded-sq-lg animate-pulse" />
          ))
        ) : enrichedMovers && enrichedMovers.length > 0 ? (
          enrichedMovers.map((mover, idx) => {
            const displayName = mover.college?.short_name || mover.college?.college_name || mover.normalized_name;
            
            return (
              <Link
                key={mover.id}
                to={`/tourhub/college-golf/${mover.normalized_name}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-sq-lg',
                  'bg-surface-card border border-border-subtle',
                  'hover:border-primary/30 hover:bg-surface-card-hover transition-all duration-200',
                  'group'
                )}
              >
                {/* Rank */}
                <div className="shrink-0 w-6 text-center">
                  <span className="text-body-sm font-semibold text-text-tertiary">
                    {idx + 1}
                  </span>
                </div>
                
                {/* Logo */}
                <div className="shrink-0 w-12 h-12 rounded-sq-lg bg-background-secondary flex items-center justify-center overflow-hidden">
                  {mover.college?.logo_url ? (
                    <img 
                      src={mover.college.logo_url} 
                      alt={displayName}
                      className="w-10 h-10 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-lg font-bold text-text-tertiary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-3 text-body-xs text-text-secondary mt-0.5">
                    <span className={cn(
                      'inline-flex items-center gap-1',
                      mover.earnings_delta >= 0 ? 'text-accent-success' : 'text-accent-error'
                    )}>
                      <DollarSign className="w-3 h-3" />
                      {formatDelta(mover.earnings_delta, '$')}
                    </span>
                    {mover.wins_delta !== 0 && (
                      <span className={cn(
                        'inline-flex items-center gap-1',
                        mover.wins_delta > 0 ? 'text-accent-warning' : 'text-text-secondary'
                      )}>
                        <Trophy className="w-3 h-3" />
                        {formatDelta(mover.wins_delta)} win{Math.abs(mover.wins_delta) !== 1 ? 's' : ''}
                      </span>
                    )}
                    {mover.cuts_delta !== 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {formatDelta(mover.cuts_delta)} cuts
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Rank Change */}
                {mover.earnings_rank_change !== null && mover.earnings_rank_change !== 0 && (
                  <div className={cn(
                    'shrink-0 px-2 py-1 rounded-full text-body-xs font-semibold',
                    mover.earnings_rank_change > 0 
                      ? 'bg-accent-success/10 text-accent-success' 
                      : 'bg-accent-error/10 text-accent-error'
                  )}>
                    {mover.earnings_rank_change > 0 ? '↑' : '↓'} {Math.abs(mover.earnings_rank_change)}
                  </div>
                )}
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8 text-body-sm text-text-secondary">
            No {direction === 'up' ? 'rising' : 'falling'} colleges this week
          </div>
        )}
      </div>
    </div>
  );
}
