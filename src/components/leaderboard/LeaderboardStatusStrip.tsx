import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';

interface LeaderboardStatusStripProps {
  user: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    total_top100_played: number;
    rank: number;
  };
}

// Generate contextual status copy based on rank and performance
function getStatusCopy(rank: number, totalPlayed: number): string {
  if (totalPlayed === 0) {
    return 'Log your first Top 100 course to get ranked.';
  }
  if (rank === 1) {
    return "You're setting the pace.";
  }
  if (rank <= 5) {
    return "You're in the hunt.";
  }
  if (rank <= 10) {
    return 'Top 10 — keep pushing.';
  }
  if (rank <= 25) {
    return 'Closing in on the leaders.';
  }
  return 'Next jump is within reach.';
}

export function LeaderboardStatusStrip({ user }: LeaderboardStatusStripProps) {
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
    ? Math.min(100, (user.total_top100_played / nextClub.threshold) * 100)
    : 100;

  const statusCopy = getStatusCopy(user.rank, user.total_top100_played);

  return (
    <div className="w-full">
      {/* Full-width strip with subtle tonal background */}
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className="w-full bg-primary/[0.04] px-4 py-4 active:bg-primary/[0.08] transition-colors"
      >
        {/* Row 1: Identity row */}
        <div className="flex items-center gap-3">
          {/* Avatar - slightly larger */}
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={52}
              src={user.avatar_url}
              alt={user.display_name}
              fallback={initials}
              ringColor={ringColor}
            />
          </div>

          {/* Main text block */}
          <div className="flex flex-col text-left flex-1 min-w-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Your position
            </span>
            <span className="text-base font-semibold text-foreground">
              #{user.rank} · {user.total_top100_played} Top 100s
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {club.tierName}
            </span>
          </div>

          {/* Next goal - compact block on right */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-[100px] text-right">
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
            <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
          </div>
        </div>

        {/* Row 2: Status line */}
        <p className="text-xs text-muted-foreground/80 mt-2 text-left pl-[64px]">
          {statusCopy}
        </p>
      </button>

      {/* Row 3: Micro-action link */}
      <div className="flex justify-center py-2.5 bg-primary/[0.02]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/top100?tab=my-progress');
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View milestones →
        </button>
      </div>
    </div>
  );
}
