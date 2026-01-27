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
  return '#E5E7EB'; // gray-200 for others
};

const getRankTextColor = (r: number) => {
  if (r <= 3) return '#FFFFFF';
  return '#6B7280'; // gray-500
};

const getCoursesColor = (r: number) => {
  if (r === 1) return 'text-[#C1A84C]'; // Chartreus Gold
  if (r === 2) return 'text-[#B8C6C9]'; // Sky Blue Silver
  if (r === 3) return 'text-[#8B7355]'; // Warm Bronze
  return 'text-amber-500'; // Default amber for others
};

/**
 * LeaderboardRowV3 - Polished leaderboard row with Apple-grade styling
 * 
 * Features:
 * - Rank badge (filled for top 3, subtle for others)
 * - SquircleAvatar with ring for top 3
 * - Name + Club stacked
 * - Large bold course number on right
 * - Current user highlight with amber accent
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
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer",
        "hover:bg-gray-50",
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
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100">
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
          isCurrentUser ? "text-amber-900" : "text-gray-900"
        )}>
          {name}
        </p>
        {homeClubName && (
          <p className="text-xs text-gray-500 truncate">{homeClubName}</p>
        )}
      </div>

      {/* Score */}
      <div className={cn(
        "text-3xl font-bold flex-shrink-0",
        isCurrentUser ? "text-amber-600" : getCoursesColor(rank)
      )}>
        {courses}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;
