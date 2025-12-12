import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';

interface LeaderboardPositionCardProps {
  user: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    total_top100_played: number;
    rank: number;
  };
  variant?: 'full' | 'compact';
}

export function LeaderboardPositionCard({ user, variant = 'full' }: LeaderboardPositionCardProps) {
  const navigate = useNavigate();
  const club = getTop100Club(user.total_top100_played);
  const nextClub = getNextTop100Club(user.total_top100_played);
  const ringColor = getRingColorForTotalPlayed(user.total_top100_played);

  const initials = user.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Progress calculation
  const progressPct = nextClub
    ? Math.min(100, ((user.total_top100_played) / nextClub.threshold) * 100)
    : 100;

  // Contextual helper copy based on rank
  const isTopRanked = user.rank === 1;
  const helperCopy = isTopRanked
    ? "You're setting the pace."
    : 'One more round puts you closer to the top.';

  if (variant === 'compact') {
    return (
      <div className="w-full bg-primary/5 border-y border-primary/20 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SquircleAvatar
            size={28}
            src={user.avatar_url}
            alt={user.display_name}
            fallback={initials}
            ringColor={ringColor}
          />
          <span className="text-xs font-medium text-foreground">
            Your position: #{user.rank}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {user.total_top100_played} Top 100 courses
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/top100?tab=my-progress')}
      className="w-full rounded-sq-md border border-border/70 bg-card px-4 py-3.5 shadow-sm active:scale-[0.99] transition-all hover:bg-muted/30"
    >
      <div className="flex items-center gap-3">
        <SquircleAvatar
          size={52}
          src={user.avatar_url}
          alt={user.display_name}
          fallback={initials}
          ringColor={ringColor}
        />

        <div className="flex flex-col text-left flex-1 min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Your position
          </span>
          <span className="text-sm font-semibold whitespace-nowrap">
            #{user.rank} · {user.total_top100_played} Top 100 courses
          </span>
          {club.tierName && (
            <span className="text-xs text-muted-foreground">
              {club.tierName}
            </span>
          )}
        </div>

        {/* Progress to next tier */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {nextClub ? (
            <div className="flex flex-col items-end gap-1 min-w-[100px]">
              <span className="text-[11px] text-muted-foreground">
                Next: <span className="font-medium">{nextClub.tierName}</span>
              </span>
              <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-primary font-medium">Max tier!</span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Helper copy */}
      <p className="text-xs text-muted-foreground mt-2 text-left">
        {helperCopy}
      </p>
    </button>
  );
}
