/**
 * CollegeCard - Premium college row for leaderboards
 * Team-style card with medal, logo badge, stats strip, and rivalry signals
 */

import { Link } from 'react-router-dom';
import { Users, DollarSign, Trophy, ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import { RankMedal } from './RankMedal';
import { CollegeBadge } from './CollegeBadge';
import { MomentumChip } from './MomentumChip';

interface CollegeCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank?: number;
  rankDelta?: number | null;
  showMomentum?: boolean;
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function CollegeCard({ stats, college, rank, rankDelta, showMomentum = false, className }: CollegeCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const isTop3 = rank !== undefined && rank <= 3;
  const isTop10 = rank !== undefined && rank <= 10;
  
  return (
    <Link
      to={`/tourhub/college-golf/${slug}`}
      className={cn(
        'relative flex items-center gap-3 p-4 rounded-sq-md',
        'bg-white/70 dark:bg-white/5',
        'ring-1 ring-slate-200/60 dark:ring-white/8',
        'hover:bg-white dark:hover:bg-white/8',
        'active:scale-[0.995] active:bg-slate-50 dark:active:bg-white/10',
        'transition-all duration-150 ease-out group',
        className
      )}
    >
      {/* Top 10 accent bar */}
      {isTop10 && (
        <div className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full",
          isTop3 ? "bg-brand-orange" : "bg-brand-orange/50"
        )} />
      )}

      {/* Rank Medal */}
      {rank !== undefined && (
        <RankMedal rank={rank} delta={rankDelta} size="md" />
      )}
      
      {/* College Badge (Logo) */}
      <CollegeBadge
        logoUrl={college?.logo_url}
        name={displayName}
        size="md"
        variant="shield"
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {displayName}
        </h3>
        
        {/* Stats Row - icon + number */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground/70" />
            {stats.player_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-500/70" />
            {formatCurrency(stats.earnings_total)}
          </span>
          {stats.wins_total > 0 && (
            <span className="inline-flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-500/70" />
              {stats.wins_total}
            </span>
          )}
          {stats.cuts_total > 0 && (
            <span className="inline-flex items-center gap-1">
              <Target className="w-3 h-3 text-muted-foreground/60" />
              {stats.cuts_total}
            </span>
          )}
        </div>
      </div>

      {/* Momentum chip */}
      {showMomentum && rankDelta !== undefined && rankDelta !== null && rankDelta !== 0 && (
        <MomentumChip value={rankDelta} size="sm" />
      )}
      
      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
    </Link>
  );
}
