import React from 'react';
import type { LeaderboardWeeklyBanner, FriendLeaderboardEntry } from '@/lib/whs/types';
import { firstName } from '@/lib/whs/utils/initials';

interface Props {
  banner: LeaderboardWeeklyBanner | null;
  /** Used to resolve friend_row_id → friend_name for the banner copy. */
  friends: FriendLeaderboardEntry[];
}

const T = {
  bg1: 'var(--hcp-bg-1)',
  bg2: 'var(--hcp-bg-2)',
  line2: 'var(--hcp-line-2)',
  inkMute: 'var(--hcp-t-60)',
  inkFaded: 'var(--hcp-t-40)',
  ink100: 'var(--hcp-t-100)',
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.14)',
};

const FlameIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path
      d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-2 2-3 2-5 0-1-1-2-1-2s3 1 3-1z"
      fill={T.amber}
      stroke={T.amber}
      strokeWidth="0.5"
    />
  </svg>
);

export const WeeklyBanner: React.FC<Props> = ({ banner, friends }) => {
  if (!banner) return null;

  let copy: string;
  if (banner.banner_type === 'activity') {
    copy = banner.metric_label;
  } else {
    const friend = banner.friend_row_id
      ? friends.find((f) => f.friend_row_id === banner.friend_row_id)
      : null;
    const name = friend ? firstName(friend.friend_name) : 'A friend';
    copy = `${name} ${banner.metric_label}`;
  }

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${T.bg2} 0%, ${T.bg1} 100%)`,
          border: `1px solid ${T.line2}`,
          borderRadius: 12,
          padding: '10px 14px 10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 3,
            bottom: 0,
            background: T.amber,
          }}
        />
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: T.amberSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FlameIcon size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: T.amber,
              textTransform: 'uppercase',
            }}
          >
            THIS WEEK
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: T.ink100,
              marginTop: 1,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {copy}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyBanner;
