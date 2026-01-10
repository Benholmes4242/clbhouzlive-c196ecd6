import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Direction = 'up' | 'down';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

function formatDelta(delta: number, prefix = ''): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${prefix}${Math.abs(delta).toLocaleString()}`;
}

interface CollegeWeeklyMoversProps {
  limit?: number;
  className?: string;
}

export function CollegeWeeklyMovers({ limit = 8, className }: CollegeWeeklyMoversProps) {
  const [direction, setDirection] = useState<Direction>('up');
  const { data: movers, isLoading } = useCollegeWeeklyMovers({ direction, limit });
  
  return (
    <div className={cn('', className)}>
      {/* Direction Tabs */}
      <Tabs value={direction} onValueChange={(v) => setDirection(v as Direction)}>
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="up" className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-accent-success" />
            Rising
          </TabsTrigger>
          <TabsTrigger value="down" className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-accent-error" />
            Falling
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Movers List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-card border border-border-subtle rounded-sq-lg animate-pulse" />
          ))
        ) : movers && movers.length > 0 ? (
          movers.map((mover, idx) => (
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
              <div className="shrink-0 w-10 h-10 rounded-sq-lg bg-background-secondary flex items-center justify-center overflow-hidden">
                {mover.college?.logo_url ? (
                  <img 
                    src={mover.college.logo_url} 
                    alt={mover.college.short_name || mover.normalized_name}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm font-bold text-text-tertiary">
                    {(mover.college?.short_name || mover.normalized_name).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                  {mover.college?.short_name || mover.college?.college_name || mover.normalized_name}
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
          ))
        ) : (
          <div className="text-center py-8 text-body-sm text-text-secondary">
            No {direction === 'up' ? 'rising' : 'falling'} colleges this week
          </div>
        )}
      </div>
    </div>
  );
}
