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
  leaderCourses?: number;
  top100Count?: number;
  onClick?: () => void;
  seasonColor?: string;
}

const GREEN = '#006747';
const GREEN_L = '#E8F5EF';
const MEDALS = ['🥇', '🥈', '🥉'];

export const LeaderboardRowV3: React.FC<LeaderboardRowV3Props> = ({
  rank,
  name,
  avatarUrl,
  homeClubName,
  courses,
  isCurrentUser,
  leaderCourses,
  onClick,
}) => {
  const gap = leaderCourses && rank > 1 ? leaderCourses - courses : 0;
  const isMedal = rank <= 3;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${name}'s profile`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className="flex items-center gap-3 active:scale-[0.98] active:opacity-90 cursor-pointer transition-all duration-150"
      style={{
        padding: 'clamp(10px,2.5vw,13px) clamp(12px,3vw,16px)',
        borderBottom: isCurrentUser ? 'none' : '1px solid rgba(0,0,0,0.06)',
        ...(isCurrentUser ? {
          background: `linear-gradient(90deg,${GREEN_L},rgba(232,245,239,0.25))`,
          borderLeft: `3px solid ${GREEN}`,
          borderRight: 'none',
        } : { borderLeft: '3px solid transparent' }),
      }}
    >
      {/* Rank */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 28, minWidth: 28 }}
      >
        {isMedal
          ? <span style={{ fontSize: 'clamp(16px,4vw,20px)', lineHeight: 1 }}>{MEDALS[rank - 1]}</span>
          : <span style={{
              fontSize: 'clamp(13px,3vw,15px)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: '#6B7280',
              fontFamily: 'DM Sans,system-ui,sans-serif',
            }}>{rank}</span>
        }
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0" style={{ width: 44, height: 44 }}>
        <SquircleAvatar
          src={avatarUrl}
          size={44}
          alt={name}
          fallback={name?.charAt(0) || '?'}
          hideRing={!isCurrentUser}
          ringColor={isCurrentUser ? GREEN : undefined}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className="truncate"
            style={{
              fontSize: 'clamp(13px,3.5vw,15px)',
              fontWeight: 600,
              color: '#0C0C0E',
              fontFamily: 'DM Sans,system-ui,sans-serif',
              letterSpacing: '-0.2px',
            }}
          >
            {name}
          </p>
          {isCurrentUser && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: GREEN,
                background: GREEN_L,
                padding: '1px 6px',
                borderRadius: 99,
                letterSpacing: '0.5px',
                fontFamily: 'DM Sans,system-ui,sans-serif',
                flexShrink: 0,
              }}
            >
              YOU
            </span>
          )}
        </div>
        {homeClubName && (
          <p
            className="truncate"
            style={{
              fontSize: 'clamp(11px,2.8vw,13px)',
              color: '#6B7280',
              fontFamily: 'DM Sans,system-ui,sans-serif',
            }}
          >
            {homeClubName}
          </p>
        )}
      </div>

      {/* Score + Gap */}
      <div className="flex-shrink-0 text-right">
        <span
          style={{
            fontSize: 'clamp(19px,5vw,22px)',
            fontWeight: 800,
            color: GREEN,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'DM Sans,system-ui,sans-serif',
          }}
        >
          {courses}
        </span>
        {gap > 0 && (
          <p
            style={{
              fontSize: 10,
              color: '#9CA3AF',
              fontWeight: 500,
              fontFamily: 'DM Sans,system-ui,sans-serif',
              marginTop: -2,
            }}
          >
            -{gap}
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaderboardRowV3;
