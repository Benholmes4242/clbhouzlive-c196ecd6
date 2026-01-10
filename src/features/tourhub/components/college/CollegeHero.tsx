import { GraduationCap, Users, DollarSign, Trophy, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface CollegeHeroProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
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

interface StatBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconColor?: string;
}

function StatBadge({ icon: Icon, label, value, iconColor }: StatBadgeProps) {
  return (
    <div className="flex flex-col items-center p-3 bg-background-secondary rounded-sq-lg">
      <Icon className={cn('w-4 h-4 mb-1', iconColor || 'text-text-tertiary')} />
      <span className="text-heading-md font-bold text-text-primary">{value}</span>
      <span className="text-body-xs text-text-secondary">{label}</span>
    </div>
  );
}

export function CollegeHero({ stats, college, className }: CollegeHeroProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  
  return (
    <div className={cn('', className)}>
      {/* Header with logo */}
      <div className="flex items-center gap-4 mb-6">
        {/* Logo */}
        <div className="shrink-0 w-20 h-20 rounded-sq-xl bg-surface-card border border-border-subtle flex items-center justify-center overflow-hidden">
          {college?.logo_url ? (
            <img 
              src={college.logo_url} 
              alt={displayName}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <GraduationCap className="w-10 h-10 text-text-tertiary" />
          )}
        </div>
        
        {/* Name & subtitle */}
        <div>
          <h1 className="text-heading-xl font-bold text-text-primary">
            {displayName}
          </h1>
          <p className="text-body-md text-text-secondary mt-1">
            {stats.player_count} PGA Tour {stats.player_count === 1 ? 'player' : 'players'} · 2025 Season
          </p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge 
          icon={DollarSign} 
          label="Earnings" 
          value={formatCurrency(stats.earnings_total)}
          iconColor="text-accent-success"
        />
        <StatBadge 
          icon={Trophy} 
          label="Wins" 
          value={stats.wins_total}
          iconColor="text-accent-warning"
        />
        <StatBadge 
          icon={Target} 
          label="Cuts Made" 
          value={stats.cuts_total}
        />
        <StatBadge 
          icon={TrendingUp} 
          label="Top 10s" 
          value={stats.top10_total}
          iconColor="text-primary"
        />
      </div>
    </div>
  );
}
