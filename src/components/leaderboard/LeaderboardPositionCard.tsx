import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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

// Generate contextual helper copy based on rank, played count, and milestone proximity
function getHelperCopy(rank: number, totalPlayed: number, nextClub: { threshold: number; tierName: string } | null): string {
  // No courses logged yet
  if (totalPlayed === 0) {
    return 'Log your first Top 100 course to get ranked.';
  }
  
  // Rank #1
  if (rank === 1) {
    return "You're setting the pace.";
  }
  
  // Top 10
  if (rank <= 10) {
    return 'Top 10 — keep it going.';
  }
  
  // Close to milestone (within 3 courses)
  if (nextClub && (nextClub.threshold - totalPlayed) <= 3) {
    const remaining = nextClub.threshold - totalPlayed;
    return `${remaining} more to unlock ${nextClub.tierName}.`;
  }
  
  // Mid-pack default
  return 'Next jump is within reach.';
}

export function LeaderboardPositionCard({ user, variant = 'full' }: LeaderboardPositionCardProps) {
  const navigate = useNavigate();
  const club = getTop100Club(user.total_top100_played);
  const nextClub = getNextTop100Club(user.total_top100_played);
  

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

  // Contextual helper copy
  const helperCopy = getHelperCopy(user.rank, user.total_top100_played, nextClub);

  if (variant === 'compact') {
    return (
      <div className="w-full bg-primary/5 border-y border-primary/20 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SquircleAvatar
            size={28}
            src={user.avatar_url}
            alt={user.display_name}
            fallback={initials}
            thinRing
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
      className="w-full px-4 py-4 active:scale-[0.99] transition-all"
    >
      {/* 3-column layout: Avatar (fixed) + Main text (flex, truncates) + Next goal (fixed width) */}
      <div className="flex items-center gap-3">
        {/* Avatar - fixed size */}
        <div className="flex-shrink-0">
          <SquircleAvatar
            size={48}
            src={user.avatar_url}
            alt={user.display_name}
            fallback={initials}
            thinRing
          />
        </div>

        {/* Main text - flex with min-w-0 for truncation */}
        <div className="flex flex-col text-left flex-1 min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Your position
          </span>
          <span className="text-sm font-semibold text-foreground truncate">
            #{user.rank} · {user.total_top100_played} Top 100s
          </span>
          <span className="text-xs text-muted-foreground truncate mt-0.5">
            {club.tierName ? `${club.tierName} · ` : ''}{helperCopy}
          </span>
        </div>

        {/* Next goal - fixed width, no-wrap, right aligned */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-[110px] text-right">
            {nextClub ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  Next: <span className="font-medium">{nextClub.tierName}</span>
                </span>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-[width]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-primary font-medium whitespace-nowrap">Max tier!</span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </button>
  );
}
