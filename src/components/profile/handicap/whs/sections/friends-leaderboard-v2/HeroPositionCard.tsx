import React from 'react';
import { initials } from '@/lib/whs/utils/initials';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  /** The self row from the leaderboard cohort. */
  selfRow: FriendLeaderboardEntry | null;
  /** Row immediately above you in the active cohort. null when you're #1 or absent. */
  rowAbove: FriendLeaderboardEntry | null;
  /** Your 1-based rank in the active cohort. */
  selfRank: number | null;
  /** Total active count. */
  totalActive: number;
}

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkSoft: 'var(--hcp-t-80)',
  inkFaded: 'var(--hcp-t-40)',
  bg1: 'var(--hcp-bg-1)',
  bg2: 'var(--hcp-bg-2)',
  bg3: 'var(--hcp-bg-3)',
  line2: 'var(--hcp-line-2)',
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.14)',
  green: '#22C55E',
  red: '#EF4444',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

function firstName(name: string | null | undefined): string {
  const formatted = reformatFriendName(name);
  return formatted.split(' ')[0] || formatted;
}

export const HeroPositionCard: React.FC<Props> = ({
  selfRow,
  rowAbove,
  selfRank,
  totalActive,
}) => {
  // Always called — never short-circuit a hook with `if (!selfRow) return null`.
  const userId = selfRow?.friend_user_id ?? undefined;
  const percentileQuery = useHandicapPercentile(userId);

  if (!selfRow) return null;

  const yourHcp = selfRow.friend_handicap_index;
  const yourIsPlus = yourHcp != null && yourHcp < 0;
  const yourClub = selfRow.friend_home_club ?? null;

  const percentileTop =
    percentileQuery.data?.available === true ? percentileQuery.data.percentile_top : null;

  // Gap-to-catch math
  const aboveHcp = rowAbove?.friend_handicap_index ?? null;
  const gap =
    yourHcp != null && aboveHcp != null ? Number((aboveHcp - yourHcp).toFixed(1)) : null;

  // Direction-of-travel: who's improved more in 30d?
  // handicap_30d_delta is current - 30d_ago, so MORE NEGATIVE = improved more.
  const showDirection =
    rowAbove != null &&
    rowAbove.handicap_30d_delta != null &&
    selfRow.handicap_30d_delta != null;
  const widening =
    showDirection && rowAbove!.handicap_30d_delta! < selfRow.handicap_30d_delta!;

  return (
    <div
      style={{
        margin: '0 20px 16px',
        padding: 16,
        background: T.bg2,
        border: `1px solid ${T.line2}`,
        borderRadius: 16,
        fontFamily: FONT,
      }}
    >
      {/* Top: avatar + position + percentile + hcp + club */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '34%',
            overflow: 'hidden',
            background: T.bg3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.inkSoft,
            flexShrink: 0,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.01em',
          }}
        >
          {selfRow.friend_thumbnail_url ? (
            <img
              src={selfRow.friend_thumbnail_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{initials(selfRow.friend_name)}</span>
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: T.amber,
              textTransform: 'uppercase',
            }}
          >
            YOUR POSITION
          </p>
          <div
            style={{
              marginTop: 2,
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: T.ink,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              #{selfRank ?? '—'}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.inkMute,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              of {totalActive}
            </span>
            {percentileTop != null && (
              <span
                style={{
                  marginLeft: 4,
                  background: T.amberSoft,
                  color: T.amber,
                  padding: '2px 7px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                }}
              >
                TOP {percentileTop}%
              </span>
            )}
          </div>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 13,
              fontWeight: 600,
              color: T.inkMute,
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span>HCP</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: yourIsPlus ? T.amber : T.ink,
                fontVariantNumeric: 'tabular-nums',
                textShadow: yourIsPlus
                  ? '0 0 6px rgba(247,147,30,0.30), 0 0 2px rgba(247,147,30,0.20)'
                  : 'none',
              }}
            >
              {fmtHcp(yourHcp)}
            </span>
            {yourClub && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: T.inkFaded,
                }}
              >
                · {yourClub}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Catch-strip — only shown when rowAbove exists */}
      {rowAbove && gap != null && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: T.bg1,
            border: `1px solid ${T.line2}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '34%',
              overflow: 'hidden',
              background: T.bg3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.inkSoft,
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {rowAbove.friend_thumbnail_url ? (
              <img
                src={rowAbove.friend_thumbnail_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{initials(rowAbove.friend_name)}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.16em',
                color: T.inkFaded,
                textTransform: 'uppercase',
              }}
            >
              Catch {firstName(rowAbove.friend_name)}
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12,
                fontWeight: 600,
                color: T.inkSoft,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {reformatFriendName(rowAbove.friend_name)} · #
              {(selfRank ?? 1) - 1} · {fmtHcp(aboveHcp)}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            {showDirection && (
              <span
                aria-hidden
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: widening ? T.red : T.green,
                  lineHeight: 1,
                }}
              >
                {widening ? '↗' : '↘'}
              </span>
            )}
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800,
                  color: T.green,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                  textShadow:
                    '0 0 6px rgba(34,197,94,0.40), 0 0 2px rgba(34,197,94,0.25)',
                  lineHeight: 1,
                }}
              >
                −{Math.abs(gap).toFixed(1)}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  color: T.inkFaded,
                }}
              >
                STROKES
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroPositionCard;
