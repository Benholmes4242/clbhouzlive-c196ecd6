import { Link } from 'react-router-dom';
import { Users, DollarSign, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface CollegeCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank?: number;
  className?: string;
}

export function CollegeCard({ stats, college, rank, className }: CollegeCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const isTopThree = rank !== undefined && rank <= 3;
  
  return (
    <Link
      to={`/tourhub/college-golf/${slug}`}
      className={cn(
        'block bg-card border border-border rounded-xl p-4',
        'hover:border-primary/30 hover:bg-card/90 transition-all duration-200',
        'active:scale-[0.98]',
        'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none',
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
              "text-sm font-bold",
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
            <div className="absolute inset-0 rounded-xl bg-primary/10 blur-md scale-110" />
          )}
          <div className={cn(
            "w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden relative",
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
              <span className="text-lg font-bold text-muted-foreground/60 relative z-10">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          
          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-1.5">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
              {formatCurrency(stats.earnings_total)}
            </span>
            {stats.wins_total > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-500">
                <Trophy className="w-3.5 h-3.5" />
                {stats.wins_total}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
              <Users className="w-3 h-3" />
              {stats.player_count}
            </span>
          </div>
        </div>
        
        {/* Arrow */}
        <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
      </div>
    </Link>
  );
}
