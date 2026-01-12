import { Link } from 'react-router-dom';
import { Users, DollarSign, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface CollegeCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank?: number;
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

export function CollegeCard({ stats, college, rank, className }: CollegeCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  
  return (
    <Link
      to={`/tourhub/college-golf/${slug}`}
      className={cn(
        'block bg-surface-card border border-border-subtle rounded-sq-lg p-4',
        'hover:border-primary/30 hover:bg-surface-card-hover transition-all duration-200',
        'group',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Rank Badge */}
        {rank !== undefined && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-body-sm font-semibold text-primary">
              {rank}
            </span>
          </div>
        )}
        
        {/* Logo */}
        <div className="shrink-0 w-12 h-12 rounded-sq-lg bg-background-secondary flex items-center justify-center overflow-hidden">
          {college?.logo_url ? (
            <img 
              src={college.logo_url} 
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
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-body-md font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          
          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-2 text-body-sm text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-text-tertiary" />
              {stats.player_count} players
            </span>
            <span className="inline-flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-accent-success" />
              {formatCurrency(stats.earnings_total)}
            </span>
            {stats.wins_total > 0 && (
              <span className="inline-flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-accent-warning" />
                {stats.wins_total} win{stats.wins_total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors shrink-0" />
      </div>
    </Link>
  );
}
