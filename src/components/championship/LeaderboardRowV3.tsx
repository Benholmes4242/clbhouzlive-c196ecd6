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

// Modern Country Club palette for ranks
const getRankColor = (r: number) => {
  if (r === 1) return '#C1A84C'; // Chartreus Gold
  if (r === 2) return '#B8C6C9'; // Sky Blue Silver
  if (r === 3) return '#8B7355'; // Warm Bronze
  return '#334E3D'; // Emerald for others
};

const getCoursesColor = (r: number) => {
  if (r === 1) return 'text-[#C1A84C]'; // Chartreus Gold
  if (r === 2) return 'text-[#B8C6C9]'; // Sky Blue Silver
  if (r === 3) return 'text-[#8B7355]'; // Warm Bronze
  return 'text-[#334E3D]'; // Emerald for others
};

/**
 * LeaderboardRowV3 - Large course count on right with SquircleAvatar
 * 
 * Features:
 * - Rank badge (colored for top 3)
 * - SquircleAvatar - NO achievement rings, only top 3 get subtle rank-colored rings
 * - Name + Club stacked
 * - Large bold course number on right
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
  // Top 3 get a subtle ring in their rank color, positions 4+ get no ring
  const ringColor = rank <= 3 ? getRankColor(rank) : undefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer",
        "border-b border-muted/20",
        "hover:bg-muted/30",
        isCurrentUser && "bg-primary/5 border-l-2 border-l-primary"
      )}
    >
      {/* Rank Badge */}
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: getRankColor(rank) }}
      >
        {rank}
      </div>

      {/* SquircleAvatar - Only top 3 get subtle rank ring, others have no ring */}
      <SquircleAvatar
        src={avatarUrl}
        size={44}
        ringColor={ringColor}
        alt={name}
        fallback={name?.charAt(0) || '?'}
        thinRing
      />

      {/* Name & Club */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-sm",
          isCurrentUser && "text-primary"
        )}>
          {name}
        </p>
        {homeClubName && (
          <p className="text-xs text-muted-foreground truncate">
            {homeClubName}
          </p>
        )}
      </div>

      {/* Large Course Count - Right Side */}
      <div className={cn(
        "text-2xl font-black flex-shrink-0",
        getCoursesColor(rank)
      )}>
        {courses}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;
