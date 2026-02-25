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
  seasonColor?: string;
}

// Premium rank badge colors — Gold / Silver / Bronze
const getRankColor = (r: number) => {
  if (r === 1) return '#D4A853';
  if (r === 2) return '#A8B4C0';
  if (r === 3) return '#C4956A';
  return 'hsl(var(--muted))';
};

const getRankTextColor = (r: number) => {
  if (r <= 3) return '#FFFFFF';
  return 'hsl(var(--muted-foreground))';
};

export const LeaderboardRowV3: React.FC<LeaderboardRowV3Props> = ({
  rank,
  name,
  avatarUrl,
  homeClubName,
  courses,
  isCurrentUser,
  onClick,
  seasonColor = '#006747',
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${name}'s profile`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        "flex items-center gap-3 py-4 px-5 transition-all duration-200 cursor-pointer",
        "hover:bg-[rgba(0,0,0,0.02)] active:scale-[0.98]",
        isCurrentUser && "rounded-xl"
      )}
      style={{
        ...(isCurrentUser ? {
          background: 'rgba(212, 168, 83, 0.08)',
          border: '2px solid rgba(212, 168, 83, 0.25)',
        } : {
          borderBottom: '1px solid hsl(var(--border) / 0.08)',
        }),
      }}
    >
      {/* Position Badge */}
      <div
        className="flex items-center justify-center font-bold flex-shrink-0"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: getRankColor(rank),
          color: getRankTextColor(rank),
          fontSize: 14,
        }}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0" style={{ width: 48, height: 48 }}>
        <SquircleAvatar
          src={avatarUrl}
          size={48}
          alt={name}
          fallback={name?.charAt(0) || '?'}
          hideRing
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold truncate text-foreground" style={{ letterSpacing: '-0.2px' }}>
          {name}
        </p>
        {homeClubName && (
          <p className="text-[13px] text-muted-foreground truncate">{homeClubName}</p>
        )}
      </div>

      {/* Score */}
      <div
        className="flex-shrink-0"
        style={{ color: seasonColor, fontSize: 22, fontWeight: 800 }}
      >
        {courses}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;