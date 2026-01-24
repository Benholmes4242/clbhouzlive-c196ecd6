import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getTop100Club } from '@/lib/top100Club';
import { cn } from '@/lib/utils';

interface LeaderboardPlayerRowProps {
  entry: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    total_top100_played: number;
    rank: number;
    home_club?: string | null;
  };
  isCurrentUser?: boolean;
}

// Medal colors for top 3
const MEDAL_STYLES: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  2: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600' },
  3: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
};

export function LeaderboardPlayerRow({ entry, isCurrentUser = false }: LeaderboardPlayerRowProps) {
  const navigate = useNavigate();
  const club = getTop100Club(entry.total_top100_played);
  const ringColor = getRingColorForTotalPlayed(entry.total_top100_played);

  const initials = entry.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const isTop3 = entry.rank >= 1 && entry.rank <= 3;
  const medalStyle = MEDAL_STYLES[entry.rank];

  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
      className={cn(
        'w-full px-4 py-3 flex items-center gap-3 transition-colors',
        isCurrentUser && 'bg-primary/5',
        'hover:bg-muted/20 active:bg-muted/30'
      )}
    >
      {/* Left: Avatar (fixed) */}
      <SquircleAvatar
        size={44}
        src={entry.avatar_url}
        alt={entry.display_name}
        fallback={initials}
        ringColor={ringColor}
        thinRing
        className="flex-shrink-0"
      />

      {/* Middle: Name + club/top100 count (flex-1, can truncate) */}
      <div className="flex flex-col min-w-0 flex-1 text-left">
        <span className={cn(
          'text-sm font-medium leading-tight truncate',
          isCurrentUser && 'font-semibold'
        )}>
          {entry.display_name}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {entry.home_club ? `${entry.home_club} · ` : ''}{entry.total_top100_played} Top 100s
        </span>
      </div>

      {/* Right: Rank badge (fixed) */}
      <div className="flex-shrink-0">
        {isTop3 && medalStyle ? (
          <span className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border',
            medalStyle.bg,
            medalStyle.border,
            medalStyle.text
          )}>
            {entry.rank}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center min-w-[32px] h-7 rounded-full bg-muted/60 px-2 text-xs font-medium text-muted-foreground">
            #{entry.rank}
          </span>
        )}
      </div>
    </button>
  );
}
