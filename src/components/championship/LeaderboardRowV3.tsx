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

// Premium rank badge colors — Gold / Silver / Bronze
const getRankColor = (r: number) => {
  if (r === 1) return '#D4A853'; // Gold
  if (r === 2) return '#A8B4C0'; // Silver
  if (r === 3) return '#C4956A'; // Bronze
  return 'hsl(var(--muted))';
};

const getRankTextColor = (r: number) => {
  if (r <= 3) return '#FFFFFF';
  return 'hsl(var(--muted-foreground))';
};

/**
 * LeaderboardRowV3 - Refined leaderboard row with premium styling
 * 
 * - Gold/Silver/Bronze rank badges for top 3
 * - Green stat color (#40916C) for all ranks
 * - Gold-tinted highlight for current user
 * - Subtle row dividers
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
      role="button"
      tabIndex={0}
      aria-label={`View ${name}'s profile`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        "flex items-center gap-3 py-3 px-4 transition-all duration-200 cursor-pointer",
        "hover:bg-[rgba(0,0,0,0.02)] active:scale-[0.98]",
        isCurrentUser && "rounded-xl"
      )}
      style={{
        ...(isCurrentUser ? {
          background: 'rgba(212, 168, 83, 0.08)',
          border: '1px solid rgba(212, 168, 83, 0.2)',
        } : {
          borderBottom: '1px solid hsl(var(--border) / 0.15)',
        }),
      }}
    >
      {/* Position Badge */}
      <div 
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{ 
          backgroundColor: getRankColor(rank),
          color: getRankTextColor(rank),
        }}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0" style={{ width: 44, height: 44 }}>
        <SquircleAvatar
          src={avatarUrl}
          size={44}
          alt={name}
          fallback={name?.charAt(0) || '?'}
          hideRing
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-semibold truncate text-foreground",
        )}>
          {name}
        </p>
        {homeClubName && (
          <p className="text-xs text-muted-foreground truncate">{homeClubName}</p>
        )}
      </div>

      {/* Score — green for all */}
      <div 
        className="text-lg font-bold flex-shrink-0"
        style={{ color: '#40916C' }}
      >
        {courses}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;
