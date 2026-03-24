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
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${name}'s profile`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        "flex items-center gap-3 py-3.5 px-2 transition-all duration-200 cursor-pointer",
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
      {/* Position — fixed-width column, crown floats above via absolute so number stays aligned */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center relative"
        style={{ width: 28, minWidth: 28 }}
      >
        {rank === 1 && (
          <span
            style={{
              position: 'absolute',
              top: -14,
              fontSize: 11,
              lineHeight: 1,
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            👑
          </span>
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: rank === 1
              ? 'hsl(var(--accent-amber))'
              : rank <= 3
                ? 'hsl(var(--accent-amber))'
                : 'hsl(var(--muted-foreground))',
            lineHeight: 1,
          }}
        >
          {rank}
        </span>
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
        style={{ color: 'hsl(var(--accent-amber))', fontSize: 22, fontWeight: 800 }}
      >
        {courses}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;
