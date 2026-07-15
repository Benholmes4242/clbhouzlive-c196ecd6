import React from 'react';
import type { LeaderboardWeeklyBanner, FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  banner: LeaderboardWeeklyBanner | null;
  /** Retained for parent compatibility; no longer used (RPC delivers complete copy). */
  friends?: FriendLeaderboardEntry[];
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const WeeklyBanner: React.FC<Props> = ({ banner }) => {
  if (!banner) return null;

  const copy = banner.metric_label;

  return (
    <div style={{ padding: '8px 16px' }}>
      <div
        style={{
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line)',
          borderLeft: '3px solid var(--hcp-line)',
          borderRadius: 14,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(247,147,30,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>🔥</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#F7931E',
              textTransform: 'uppercase',
            }}
          >
            THIS WEEK
          </div>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              marginTop: 3,
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
