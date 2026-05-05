import React from 'react';
import { initials } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  entry: FriendLeaderboardEntry;
  rank: number;
  isFirst: boolean;
  isLast: boolean;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  inkFaded: 'rgba(15,23,42,0.40)',
  hairline: 'rgba(15,23,42,0.08)',
  hairlineSoft: 'rgba(15,23,42,0.06)',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
};

function fmtRel(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return '1w ago';
  return `${Math.floor(days / 7)}w ago`;
}

function reformatName(name: string): string {
  if (!name) return 'Unknown';
  if (name.includes(',')) {
    const [last, first] = name.split(',').map((s) => s.trim());
    return `${first} ${last}`;
  }
  return name;
}

export const LeaderboardRow: React.FC<Props> = ({ entry, rank, isFirst, isLast }) => {
  const isYou = entry.is_self;
  const displayName = isYou ? 'You' : reformatName(entry.friend_name);

  return (
    <button
      type="button"
      onClick={() => {}}
      aria-label={`${displayName}, ranked ${rank}, handicap ${fmtHcp(entry.friend_handicap_index)}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: 'calc(100% - 40px)',
        margin: '0 20px',
        textAlign: 'left',
        padding: '10px 0',
        borderTop: isFirst ? `1px solid ${T.hairline}` : 'none',
        borderBottom: `1px solid ${isLast ? T.hairline : T.hairlineSoft}`,
        borderLeft: 'none',
        borderRight: 'none',
        background: isYou ? T.amberTint : 'transparent',
        cursor: 'pointer',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 22,
          textAlign: 'center',
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          color: rank <= 3 ? T.amberDeep : T.inkMute,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {rank}
      </div>

      {/* Avatar + name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flex: 1,
          minWidth: 0,
          paddingLeft: 6,
        }}
      >
        <div
          style={{
            width: 33,
            height: 33,
            borderRadius: '34%',
            overflow: 'hidden',
            background: isYou ? T.ink : 'rgba(15,23,42,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isYou ? '#fff' : T.inkSoft,
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '-0.01em',
          }}
        >
          {entry.friend_thumbnail_url ? (
            <img
              src={entry.friend_thumbnail_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{initials(entry.friend_name)}</span>
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: isYou ? 700 : 600,
              color: T.ink,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 10,
              fontWeight: 600,
              color: T.inkMute,
              letterSpacing: '0.02em',
            }}
          >
            {fmtRel(entry.last_round_played_at)}
          </p>
        </div>
      </div>

      {/* HCP */}
      <div
        style={{
          width: 50,
          textAlign: 'right',
          flexShrink: 0,
          fontSize: 15,
          fontWeight: 700,
          color: T.ink,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {fmtHcp(entry.friend_handicap_index)}
      </div>
    </button>
  );
};

export default LeaderboardRow;
