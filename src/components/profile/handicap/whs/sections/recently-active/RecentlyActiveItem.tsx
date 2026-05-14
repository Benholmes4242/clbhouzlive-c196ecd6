import React from 'react';
import { firstName } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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
  // Active dot: green for on-app, amber-gold gradient (matches handicap ring) for EG-only.
  const dotBackground: string | null = isActive
    ? isOnApp
      ? '#22C55E'
      : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
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
        <SquircleAvatar
          src={entry.friend_thumbnail_url}
          alt={entry.friend_name}
          size={60}
          userId={entry.friend_user_id ?? entry.friend_row_id}
          hideRing
        />
        {dotBackground && (
          <span
            aria-label={
              isOnApp
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
              background: dotBackground,
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
          letterSpacing: '-0.005em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmtHcp(entry.friend_handicap_index)}
      </p>
    </Tag>
  );
};

export default RecentlyActiveItem;
