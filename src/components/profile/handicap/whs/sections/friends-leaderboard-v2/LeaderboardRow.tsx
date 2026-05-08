import React from 'react';
import { Minus } from 'lucide-react';
import { initials } from '@/lib/whs/utils/initials';
import { reformatFriendName, fmtRelative } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  entry: FriendLeaderboardEntry;
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  /** True when this friend hasn't played in the last 90 days. Always
   *  false for the self row. */
  isStaleRow: boolean;
  /** Gap to your own handicap, in strokes. Negative = friend is ahead.
   *  Only populated for the rows immediately above and below "You". */
  gapFromYou: number | null;
  onClick?: () => void;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  inkFaded: 'rgba(15,23,42,0.40)',
  ink25: 'rgba(15,23,42,0.25)',
  hairline: 'rgba(15,23,42,0.08)',
  hairlineSoft: 'rgba(15,23,42,0.06)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberInk: '#854F0B',
  amberTint: 'rgba(247,147,30,0.10)',
  amberSoft: 'rgba(247,147,30,0.14)',
  green: '#059669',
  greenDeep: '#15803D',
  red: '#9F1339',
  redDeep: '#991B1B',
};

const fmtRel = (iso: string | null) => fmtRelative(iso, { compact: true });

interface TrendPillInfo {
  sign: string;
  value: string;
  color: string;
}

function buildTrendPill(delta: number | null | undefined): TrendPillInfo | null {
  if (delta == null || Math.abs(delta) < 0.05) return null;
  if (delta < 0) {
    return { sign: '↓', value: Math.abs(delta).toFixed(1), color: T.green };
  }
  return { sign: '↑', value: delta.toFixed(1), color: T.red };
}

export const LeaderboardRow: React.FC<Props> = ({
  entry,
  rank,
  isFirst,
  isLast,
  isStaleRow,
  gapFromYou,
  onClick,
}) => {
  const isYou = entry.is_self;
  const displayName = isYou ? 'You' : reformatFriendName(entry.friend_name);
  const Tag: any = onClick ? 'button' : 'div';

  const hcp = entry.friend_handicap_index;
  const isPlusHandicap = hcp != null && hcp < 0;
  const trend = buildTrendPill(entry.handicap_30d_delta);

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      role={onClick ? undefined : 'listitem'}
      aria-label={`${displayName}, ranked ${rank}, handicap ${fmtHcp(hcp)}${isStaleRow ? ', stale' : ''}`}
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
        opacity: isStaleRow ? 0.6 : 1,
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

      {/* Avatar + name + meta */}
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
            background: 'rgba(15,23,42,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.inkSoft,
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
              color: isStaleRow ? T.amberInk : T.inkMute,
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {isStaleRow && (
              <span
                style={{
                  background: T.amberSoft,
                  color: T.amberInk,
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                }}
              >
                STALE
              </span>
            )}
            {fmtRel(entry.last_round_played_at)}
          </p>
        </div>
      </div>

      {/* Trend pill (30d delta) */}
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
        {trend ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 1,
              fontSize: 11,
              fontWeight: 800,
              color: trend.color,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            <span style={{ fontSize: 10 }}>{trend.sign}</span>
            {trend.value}
          </span>
        ) : (
          <Minus size={12} color={T.ink25} strokeWidth={2.4} />
        )}
      </div>

      {/* HCP + adjacent gap */}
      <div
        style={{
          width: 60,
          textAlign: 'right',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: isPlusHandicap ? T.amberInk : T.ink,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {fmtHcp(hcp)}
        </span>
        {gapFromYou != null && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: gapFromYou < 0 ? T.greenDeep : T.redDeep,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {gapFromYou < 0
              ? `${gapFromYou.toFixed(1)} from you`
              : `+${gapFromYou.toFixed(1)} from you`}
          </span>
        )}
      </div>
    </Tag>
  );
};

export default LeaderboardRow;
