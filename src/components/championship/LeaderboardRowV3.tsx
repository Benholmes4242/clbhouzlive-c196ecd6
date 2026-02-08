import React from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface LeaderboardRowV3Props {
  rank: number;
  name: string;
  avatarUrl: string | null;
  homeClubName: string | null;
  courses: number;
  isCurrentUser: boolean;
  top100Count?: number;
  onClick?: () => void;
}

// Modern Country Club palette for ranks — intentional brand colors
const getRankColor = (r: number) => {
  if (r === 1) return '#C1A84C'; // Chartreus Gold
  if (r === 2) return '#B8C6C9'; // Sky Blue Silver
  if (r === 3) return '#8B7355'; // Warm Bronze
  return 'hsl(var(--muted))';
};

const getRankTextColor = (r: number) => {
  if (r <= 3) return '#FFFFFF';
  return 'hsl(var(--muted-foreground))';
};

// Podium positions keep their metallic color; rank 4+ uses foreground (not amber)
const getCoursesColor = (r: number, isCurrentUser: boolean) => {
  if (isCurrentUser) return 'text-amber-600';
  if (r === 1) return 'text-[#C1A84C]';
  if (r === 2) return 'text-[#B8C6C9]';
  if (r === 3) return 'text-[#8B7355]';
  return 'text-foreground';
};

/**
 * LeaderboardRowV3 - Polished leaderboard row with Apple-grade styling
 */
export const LeaderboardRowV3: React.FC<LeaderboardRowV3Props> = ({
  rank,
  name,
  avatarUrl,
  homeClubName,
  courses,
  isCurrentUser,
  onClick,
}) => {
  // Top 3 get a subtle ring in their rank color
  const ringColor = rank <= 3 ? getRankColor(rank) : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${name}'s profile`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer",
        "hover:bg-muted/50 active:scale-[0.98]",
        isCurrentUser && "bg-amber-50 border border-amber-200"
      )}
    >
      {/* Position Badge */}
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ 
          backgroundColor: getRankColor(rank),
          color: getRankTextColor(rank)
        }}
      >
        {rank}
      </div>

      {/* Avatar with ring for top 3 */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
        <SquircleAvatar
          src={avatarUrl}
          size={40}
          ringColor={ringColor}
          alt={name}
          fallback={name?.charAt(0) || '?'}
          thinRing
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-semibold truncate",
          isCurrentUser ? "text-amber-900" : "text-foreground"
        )}>
          {name}
        </p>
        {homeClubName && (
          <p className="text-xs text-muted-foreground truncate">{homeClubName}</p>
        )}
      </div>

      {/* Score */}
      <div className={cn(
        "text-3xl font-bold flex-shrink-0",
        getCoursesColor(rank, isCurrentUser)
      )}>
        {courses}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;
