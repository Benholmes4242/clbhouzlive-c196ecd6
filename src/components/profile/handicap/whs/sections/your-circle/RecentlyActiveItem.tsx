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
  const Tag = (onClick ? 'button' : 'div') as React.ElementType;

  const isOnApp = entry.is_clbhouz_user;

  const hcpStr = fmtHcp(entry.friend_handicap_index);

  const relative = entry.last_round_played_at
    ? fmtRelative(entry.last_round_played_at, { compact: false })
    : null;

  return (
    <Tag
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 92,
        background: isOnApp ? 'var(--hcp-bg-1)' : 'var(--hcp-bg-2)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 14,
        padding: '9px 8px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      <SquircleAvatar
        src={pickAvatarSrc(entry.friend_thumbnail_url, entry.friend_profile_photo_url)}
        alt={entry.friend_name}
        size={56}
        userId={entry.friend_user_id ?? entry.friend_row_id}
        hairlineRing
      />
      <p
        style={{
          marginTop: 6,
          marginBottom: 0,
          fontSize: 11.5,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.005em',
          lineHeight: 1,
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
          color: 'var(--hcp-t-100)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {hcpStr}
      </p>
      {relative && (
        <p
          style={{
            marginTop: 3,
            marginBottom: 0,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: isActive ? 'var(--hcp-good, #34D399)' : 'var(--hcp-t-40)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {relative}
        </p>
      )}
    </Tag>
  );
};

export default RecentlyActiveItem;
