import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardRowV3Props {
  rank: number;
  name: string;
  avatarUrl: string | null;
  homeClubName: string | null;
  courses: number;
  isCurrentUser: boolean;
  onClick?: () => void;
}

const getRankColor = (r: number) => {
  if (r === 1) return '#F59E0B'; // Gold
  if (r === 2) return '#94A3B8'; // Silver
  if (r === 3) return '#F97316'; // Bronze
  return '#9CA3AF'; // Grey
};

const getCoursesColor = (r: number) => {
  if (r === 1) return 'text-amber-500';
  if (r === 2) return 'text-slate-400';
  if (r === 3) return 'text-orange-500';
  return 'text-muted-foreground';
};

/**
 * LeaderboardRowV3 - Large course count on right
 * 
 * Features:
 * - Rank badge (colored for top 3)
 * - Avatar
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
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer",
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

      {/* Avatar */}
      <Avatar className="w-11 h-11 flex-shrink-0">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>{name?.charAt(0) || '?'}</AvatarFallback>
      </Avatar>

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
