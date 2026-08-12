import React from 'react';
import type { LeaderboardWeeklyBanner, FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  banner: LeaderboardWeeklyBanner | null;
  /** Retained for parent compatibility; no longer used (RPC delivers complete copy). */
  friends?: FriendLeaderboardEntry[];
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--hcp-t-60)',
              textTransform: 'uppercase',
            }}
          >
            THIS WEEK
          </div>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              marginTop: 3,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums lining-nums',
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
