import React from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface LeaderboardRowV2Props {
  rank: number;
  name: string;
  avatarUrl: string | null;
  homeClubName: string | null;
  statText: string;
  courses: number;
  isCurrentUser: boolean;
  onClick?: () => void;
}

/**
 * LeaderboardRowV2 - Stacked layout to prevent truncation
 * 
 * Features:
 * - Stacked layout: Name → Club → Stat
 * - NO "— —" or decorative right-side elements
 * - Proper truncation at each level
 * - Clear visual hierarchy
 * - Achievement ring from courses count
 */
export const LeaderboardRowV2: React.FC<LeaderboardRowV2Props> = ({
  rank,
  name,
  avatarUrl,
  homeClubName,
  statText,
  courses,
  isCurrentUser,
  onClick,
}) => {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const getRankStyle = () => {
    if (rank === 1) return "bg-amber-500 text-white";
    if (rank === 2) return "bg-slate-400 text-white";
    if (rank === 3) return "bg-orange-400 text-white";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer",
        "hover:bg-muted/50",
        isCurrentUser && "bg-primary/5 border border-primary/20"
      )}
    >
      {/* Rank */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
        getRankStyle()
      )}>
        {rank}
      </div>

      {/* Avatar with achievement ring */}
      <SquircleAvatar
        size={44}
        src={avatarUrl}
        alt={name}
        fallback={initials}
        hideRing
        className="flex-shrink-0"
      />

      {/* Stacked Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-sm truncate",
          isCurrentUser && "text-primary"
        )}>
          {name}
        </p>
        {homeClubName && (
          <p className="text-xs text-muted-foreground truncate">
            {homeClubName}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {statText}
        </p>
      </div>

      {/* NO right-side "— —" or decorative elements */}
    </div>
  );
};

export default LeaderboardRowV2;
