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

export const LeaderboardRowV3: React.FC<LeaderboardRowV3Props> = ({
  rank,
  name,
  avatarUrl,
  homeClubName,
  courses,
  isCurrentUser,
  onClick,
  seasonColor = 'hsl(var(--accent-amber))',
}) => {
  const isTop3 = rank <= 3;
  const isFirst = rank === 1;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${name}'s profile`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        "flex items-center gap-3 py-4 px-5 transition-all duration-200 cursor-pointer relative",
        "active:scale-[0.98] active:opacity-90",
        isCurrentUser && "rounded-xl"
      )}
      style={{
        ...(isCurrentUser ? {
          background: 'hsl(var(--accent-amber) / 0.08)',
          border: '2px solid hsl(var(--accent-amber) / 0.25)',
        } : {
          borderBottom: '1px solid hsl(var(--border) / 0.2)',
        }),
      }}
    >
      {/* Left accent bar on current user */}
      {isCurrentUser && (
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
          style={{ backgroundColor: seasonColor }}
        />
      )}

      {/* Position — plain typographic rank */}
      <span
        className="flex-shrink-0 text-center"
        style={{
          width: 28,
          fontSize: 13,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: isTop3
            ? '#F5A623'
            : 'hsl(var(--muted-foreground))',
        }}
      >
        {isFirst && <span style={{ fontSize: 12, marginRight: 1 }}>👑</span>}
        {rank}
      </span>

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
          {isCurrentUser && (
            <span
              className="ml-1.5 text-[9px] font-bold uppercase align-middle"
              style={{ color: '#F5A623' }}
            >
              YOU
            </span>
          )}
        </p>
        {homeClubName && (
          <p className="text-[13px] text-muted-foreground truncate">{homeClubName}</p>
        )}
      </div>

      {/* Score */}
      <div
        className="flex-shrink-0"
        style={{
          color: isTop3 ? '#F5A623' : '#0F172A',
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {courses}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;
