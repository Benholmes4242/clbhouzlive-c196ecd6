import React from 'react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  entry: FriendLeaderboardEntry;
  isActive: boolean;
  onClick?: () => void;
}

export const RecentlyActiveItem: React.FC<Props> = ({ entry, isActive, onClick }) => {
  const display = firstName(entry.friend_name);
  const Tag: any = onClick ? 'button' : 'div';

  const isOnApp = entry.is_clbhouz_user;
  // Active dot: green for on-app, amber for EG-only. No dot if inactive.
  const dotColor: string | null = isActive
    ? isOnApp
      ? '#22C55E'
      : '#F7931E'
    : null;

  return (
    <Tag
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 76,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        {entry.friend_thumbnail_url ? (
          <img
            src={entry.friend_thumbnail_url}
            alt={display}
            style={{
              width: 60,
              height: 60,
              borderRadius: '34%',
              objectFit: 'cover',
              border: '1px solid rgba(15,23,42,0.08)',
              background: '#F1F5F9',
              opacity: isOnApp ? 1 : 0.55,
            }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '34%',
              background: '#E2E8F0',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              border: '1px solid rgba(15,23,42,0.08)',
              opacity: isOnApp ? 1 : 0.55,
            }}
          >
            {initials(entry.friend_name)}
          </div>
        )}
        {dotColor && (
          <span
            aria-label={
              dotColor === '#22C55E'
                ? 'Active in last 7 days'
                : 'Played in last 7 days, not on Clbhouz'
            }
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: dotColor,
              border: '2px solid #F8FAFC',
            }}
          />
        )}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '-0.01em',
          maxWidth: 76,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {display}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          color: '#64748B',
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmtHcp(entry.friend_handicap_index)}
      </p>
    </Tag>
  );
};

export default RecentlyActiveItem;
