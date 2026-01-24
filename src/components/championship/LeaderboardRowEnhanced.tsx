import React from 'react';
import { cn } from '@/lib/utils';
import { Flame, TrendingUp, TrendingDown, Minus, Swords } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface LeaderboardRowEnhancedProps {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  courses: number;
  homeClub: string | null;
  streak: number;
  division: string;
  divisionColor: string;
  positionChange: number; // positive = moved up, negative = moved down, 0 = no change
  isCurrentUser: boolean;
  isRival: boolean; // Within 2 courses of current user
  lastActiveDate: string | null; // For activity indicator
  onClick?: () => void;
}

export const LeaderboardRowEnhanced: React.FC<LeaderboardRowEnhancedProps> = ({
  rank,
  displayName,
  username,
  avatarUrl,
  courses,
  homeClub,
  streak,
  division,
  divisionColor,
  positionChange,
  isCurrentUser,
  isRival,
  lastActiveDate,
  onClick,
}) => {
  // Calculate activity status
  const getActivityStatus = () => {
    if (!lastActiveDate) return 'inactive';
    const daysSince = Math.floor(
      (Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince === 0) return 'today';
    if (daysSince <= 3) return 'recent';
    if (daysSince <= 7) return 'week';
    return 'inactive';
  };

  const activityStatus = getActivityStatus();

  const activityColors = {
    today: 'bg-green-500',
    recent: 'bg-green-400',
    week: 'bg-yellow-400',
    inactive: 'bg-gray-300',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-4 rounded-sq-md transition-all cursor-pointer",
        "hover:bg-muted/50",
        isCurrentUser && "bg-primary/5 border-2 border-primary/20 shadow-sm",
        isRival && !isCurrentUser && "bg-amber-50/50 border border-amber-200/50"
      )}
    >
      {/* Rank with position change */}
      <div className="w-12 flex flex-col items-center">
        <span className={cn(
          "text-lg font-bold",
          rank === 1 && "text-amber-500",
          rank === 2 && "text-slate-400",
          rank === 3 && "text-orange-400",
        )}>
          {rank}
        </span>
        {positionChange !== 0 && (
          <div className={cn(
            "flex items-center text-xs font-medium animate-slide-in-rank",
            positionChange > 0 && "text-green-600",
            positionChange < 0 && "text-red-500",
          )}>
            {positionChange > 0 ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>{positionChange}</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                <span>{Math.abs(positionChange)}</span>
              </>
            )}
          </div>
        )}
        {positionChange === 0 && (
          <Minus className="w-3 h-3 text-muted-foreground" />
        )}
      </div>

      {/* Avatar with activity indicator - squircle shape */}
      <div className="relative">
        <SquircleAvatar
          size={48}
          src={avatarUrl}
          alt={displayName || username}
          fallback={displayName?.charAt(0) || username?.charAt(0) || '?'}
          ringColor={
            isCurrentUser ? 'hsl(var(--primary))' :
            isRival ? '#FBBF24' :
            undefined
          }
          hideRing={!isCurrentUser && !isRival}
        />
        {/* Activity dot - squircle shape */}
        <div 
          className={cn(
            "absolute -bottom-0.5 -right-0.5 border-2 border-white",
            activityColors[activityStatus]
          )}
          style={{
            width: '14px',
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
          }}
        />
      </div>

      {/* Name and meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold truncate",
            isCurrentUser && "text-primary"
          )}>
            {displayName || username}
          </span>
          {isRival && !isCurrentUser && (
            <Swords className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
          {streak >= 3 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Flame className={cn(
                "w-4 h-4",
                streak >= 7 ? "text-orange-500" : "text-orange-400"
              )} />
              <span className="text-xs font-medium text-orange-500">{streak}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{courses} courses</span>
          {homeClub && (
            <>
              <span>•</span>
              <span className="truncate">{homeClub}</span>
            </>
          )}
        </div>
      </div>

      {/* Division badge */}
      <div 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: `${divisionColor}15`,
          color: divisionColor,
        }}
      >
        {division.replace(' Club', '')}
      </div>
    </div>
  );
};
