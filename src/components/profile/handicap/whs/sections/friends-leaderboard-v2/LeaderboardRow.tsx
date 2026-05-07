import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { initials } from '@/lib/whs/utils/initials';
import { reformatFriendName, fmtRelative } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  entry: FriendLeaderboardEntry;
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  onClick?: () => void;
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

const fmtRel = (iso: string | null) => fmtRelative(iso, { compact: true });

export const LeaderboardRow: React.FC<Props> = ({ entry, rank, isFirst, isLast, onClick }) => {
  const isYou = entry.is_self;
  const displayName = isYou ? 'You' : reformatFriendName(entry.friend_name);
  const Tag: any = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      role={onClick ? undefined : 'listitem'}
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
        cursor: onClick ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
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

      {/* Inline sparkline (last 5 differentials).
          TODO: widen get_friend_leaderboard to return last_5_differentials per friend.
          Until then, render a flat placeholder line for friends; "You" will get a
          real sparkline once wired through from the page-level whs hooks. */}
      <div
        style={{
          width: 60,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: 6,
        }}
      >
        {(() => {
          // Determine stroke colour from 30d delta direction (best signal we have).
          const d = entry.handicap_30d_delta;
          const stroke =
            d == null || Math.abs(d) < 0.1
              ? T.inkMute
              : d < 0
                ? '#059669'
                : '#9F1339';
          // 5 evenly-spaced flat points (placeholder until RPC widens).
          const points = '0,9 15,9 30,9 45,9 60,9';
          return (
            <svg width={60} height={18} viewBox="0 0 60 18" style={{ display: 'block' }}>
              <polyline
                points={points}
                fill="none"
                stroke={stroke}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={60} cy={9} r={2} fill={stroke} />
            </svg>
          );
        })()}
      </div>

      {/* HCP with up/down arrow */}
      <div
        style={{
          width: 60,
          textAlign: 'right',
          flexShrink: 0,
          fontSize: 15,
          fontWeight: 700,
          color: T.ink,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
        }}
      >
        {entry.handicap_30d_delta != null && Math.abs(entry.handicap_30d_delta) >= 0.1 && (
          entry.handicap_30d_delta < 0 ? (
            <ArrowDown size={10} strokeWidth={2.6} color="#059669" />
          ) : (
            <ArrowUp size={10} strokeWidth={2.6} color="#9F1339" />
          )
        )}
        {fmtHcp(entry.friend_handicap_index)}
      </div>
    </Tag>
  );
};

export default LeaderboardRow;
