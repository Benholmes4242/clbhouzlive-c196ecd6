import React from 'react';
import { firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtHcp } from '@/lib/whs/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
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
  const dotBackground: string | null = isActive
    ? isOnApp
      ? '#F7931E'
      : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
    : null;

  const hcpStr = fmtHcp(entry.friend_handicap_index);
  const isPlusHcp = typeof hcpStr === 'string' && hcpStr.trim().startsWith('+');

  const relative = entry.last_round_played_at
    ? fmtRelative(entry.last_round_played_at, { compact: false })
    : null;

  return (
    <Tag
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 92,
        background: 'var(--hcp-bg-2)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: '10px 8px 9px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      <div style={{ position: 'relative' }}>
        <SquircleAvatar
          src={pickAvatarSrc(entry.friend_thumbnail_url, entry.friend_profile_photo_url)}
          alt={entry.friend_name}
          size={56}
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
              top: -1,
              right: -1,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: dotBackground,
              border: '2px solid var(--hcp-bg-2)',
            }}
          />
        )}
      </div>
      <p
        style={{
          marginTop: 8,
          marginBottom: 0,
          fontSize: 11.5,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.005em',
          maxWidth: 76,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {display}
      </p>
      <p
        style={{
          marginTop: 3,
          marginBottom: 0,
          fontSize: 13,
          fontWeight: 800,
          color: isPlusHcp ? '#4ADE80' : 'var(--hcp-t-100)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {hcpStr}
      </p>
      {relative && (
        <p
          style={{
            marginTop: 4,
            marginBottom: 0,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-40, rgba(255,255,255,0.4))',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {relative}
        </p>
      )}
    </Tag>
  );
};

export default RecentlyActiveItem;
