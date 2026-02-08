import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ChevronRight, TrendingUp, Star, Trophy } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useLeaderboardSpotlight, SpotlightType } from '@/hooks/useLeaderboardSpotlight';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfilePathById } from '@/lib/profileRoutes';

const SPOTLIGHT_CONFIG: Record<SpotlightType, { label: string; icon: typeof Trophy; formatValue: (v: number) => string }> = {
  most_played: {
    label: 'Most Played',
    icon: Trophy,
    formatValue: (v) => `+${v} Top 100s this month`,
  },
  highest_rated: {
    label: 'Highest Rated',
    icon: Star,
    formatValue: (v) => `Avg rating ${v}`,
  },
  fastest_riser: {
    label: 'Fastest Riser',
    icon: TrendingUp,
    formatValue: (v) => `↑ ${v} places`,
  },
};

export function LeaderboardSpotlightSection() {
  const navigate = useNavigate();
  const { data: spotlights, isLoading } = useLeaderboardSpotlight();

  const handlePlayerClick = (userId: string, creatorOnly?: boolean) => {
    const path = getProfilePathById(userId, creatorOnly);
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-36 rounded-sq-md flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!spotlights || spotlights.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Title row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Setting the Standard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Top performers this month</p>
        </div>
        <button
          type="button"
          className="p-1.5 hover:bg-muted rounded-sq-sm transition-colors"
          aria-label="How it's measured"
        >
          <Info className="h-4 w-4 text-muted-foreground/60" />
        </button>
      </div>

      {/* Spotlight tiles - horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {spotlights.map((player) => {
          const config = SPOTLIGHT_CONFIG[player.spotlight_type];
          const Icon = config.icon;
          const initials = player.display_name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';

          return (
            <button
              key={player.user_id}
              type="button"
              onClick={() => handlePlayerClick(player.user_id)}
              className="flex-shrink-0 w-36 bg-muted/30 backdrop-blur-sm rounded-sq-md p-3 text-left
                hover:bg-muted/50 active:scale-[0.98] transition-all"
            >
              {/* Avatar */}
              <div className="mb-2">
                <SquircleAvatar
                  size={40}
                  src={player.avatar_url}
                  alt={player.display_name}
                  fallback={initials}
                  ringColor={getRingColorForTotalPlayed(0)}
                />
              </div>

              {/* Name */}
              <p className="text-sm font-medium text-foreground truncate">
                {player.display_name}
              </p>
              
              {/* Home club */}
              {player.home_club && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {player.home_club}
                </p>
              )}

              {/* Metric line */}
              <p className="text-xs font-medium text-foreground mt-2 truncate">
                {config.formatValue(player.metric_value)}
              </p>

              {/* Badge label */}
              <span className="inline-block mt-1.5 text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wide">
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* View qualifying courses CTA */}
      <div className="flex justify-center py-2.5">
        <button
          type="button"
          onClick={() => navigate('/top100?tab=leaderboard&view=courses')}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View qualifying courses
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Bottom divider */}
      <div className="h-px bg-border/30" />
    </div>
  );
}
