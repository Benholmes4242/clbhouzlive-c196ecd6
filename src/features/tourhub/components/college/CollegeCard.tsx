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
  const isTopThree = rank !== undefined && rank <= 3;
  
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
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        {rank !== undefined && (
          <div className={cn(
            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isTopThree 
              ? "bg-primary/15 shadow-sm shadow-primary/10" 
              : "bg-muted/50"
          )}>
            <span className={cn(
              "text-body-sm font-bold",
              isTopThree ? "text-primary" : "text-muted-foreground"
            )}>
              {rank}
            </span>
          </div>
        )}
        
        {/* Logo with premium depth */}
        <div className="relative shrink-0">
          {/* Subtle glow for top 3 */}
          {isTopThree && (
            <div className="absolute inset-0 rounded-sq-lg bg-primary/10 blur-md scale-110" />
          )}
          <div className={cn(
            "w-12 h-12 rounded-sq-lg bg-background-secondary flex items-center justify-center overflow-hidden relative",
            "shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)]",
            isTopThree && "shadow-[0_2px_12px_-2px_rgba(var(--primary),0.15)]"
          )}>
            {/* Glossy highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
            
            {college?.logo_url ? (
              <img 
                src={college.logo_url} 
                alt={displayName}
                className="w-10 h-10 object-contain relative z-10"
                loading="lazy"
              />
            ) : (
              <span className="text-lg font-bold text-text-tertiary relative z-10">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        {/* Content - Enhanced hierarchy */}
        <div className="flex-1 min-w-0">
          <h3 className="text-body-md font-bold text-text-primary truncate group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          
          {/* Stats Row - metric emphasized, player count subdued */}
          <div className="flex items-center gap-4 mt-1.5">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-success">
              <DollarSign className="w-3.5 h-3.5" />
              {formatCurrency(stats.earnings_total)}
            </span>
            {stats.wins_total > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-warning">
                <Trophy className="w-3.5 h-3.5" />
                {stats.wins_total}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
              <Users className="w-3 h-3" />
              {stats.player_count}
            </span>
          </div>
        </div>
        
        {/* Arrow - consistent alignment */}
        <ArrowRight className="w-5 h-5 text-text-tertiary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
      </div>
    </Link>
  );
}
