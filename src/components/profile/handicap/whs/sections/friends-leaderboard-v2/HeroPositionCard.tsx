import React from 'react';
import { firstName, initials } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import { useFriendRecentRounds } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry, FriendRecentRound } from '@/lib/whs/types';

interface Props {
  /** The self row from the leaderboard cohort. */
  selfRow: FriendLeaderboardEntry | null;
  /** Row immediately above you in the active cohort. null when you're #1 or absent. */
  rowAbove: FriendLeaderboardEntry | null;
  /** Your 1-based rank in the active cohort. */
  selfRank: number | null;
  /** Total active count. */
  totalActive: number;
  /** Phase 3: expand state — controlled by the section. */
  expanded?: boolean;
  /** Phase 3: tap handler for the catch-strip. */
  onToggleExpand?: () => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkSoft: 'var(--hcp-t-80)',
  inkFaded: 'var(--hcp-t-40)',
  bg1: 'var(--hcp-bg-1)',
  bg2: 'var(--hcp-bg-2)',
  bg3: 'var(--hcp-bg-3)',
  line: 'var(--hcp-line-1)',
  line2: 'var(--hcp-line-2)',
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.14)',
  green: '#059669',
  greenDeep: '#16A34A',
  red: '#9F1D1D',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';


export const HeroPositionCard: React.FC<Props> = ({
  selfRow,
  rowAbove,
  selfRank,
  totalActive,
  expanded = false,
  onToggleExpand,
  viewMode = 'owner',
  ownerFirstName = null,
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
  const showDirection =
    rowAbove != null &&
    rowAbove.handicap_30d_delta != null &&
    selfRow.handicap_30d_delta != null;
  const widening =
    showDirection && rowAbove!.handicap_30d_delta! < selfRow.handicap_30d_delta!;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        margin: '0 20px 16px',
        padding: 16,
        background: T.bg1,
        border: `1px solid ${T.line2}`,
        borderRadius: 16,
        fontFamily: FONT,
      }}
    >
      {/* Calm: amber radial glow removed for legibility */}

      {/* Top: avatar + position + percentile + hcp + club */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            flexShrink: 0,
            width: 68,
            height: 68,
            borderRadius: '34%',
            padding: 3,
            background: `linear-gradient(135deg, ${T.amber}, rgba(247,147,30,0.66))`,
            boxShadow: `0 0 14px ${T.amber}55`,
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: '34%',
              overflow: 'hidden',
              background: T.bg3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.inkSoft,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}
          >
            {(() => {
              const src = pickAvatarSrc(selfRow.friend_thumbnail_url, selfRow.friend_profile_photo_url);
              return src ? (
                <img
                  src={src}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{initials(selfRow.friend_name)}</span>
              );
            })()}
          </div>
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
            {viewMode === 'friend'
              ? `${ownerFirstName ? `${ownerFirstName.toUpperCase()}'S` : 'THEIR'} POSITION`
              : 'YOUR POSITION'}
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

      {/* Catch-strip — only shown when rowAbove exists. Promoted to button in Phase 3. */}
      {rowAbove && gap != null && (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded ? true : false}
          aria-label={`Catch ${firstName(rowAbove.friend_name)}. ${
            expanded ? 'Hide' : 'Show'
          } recent form.`}
          style={{
            position: 'relative',
            marginTop: 14,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            background: T.bg2,
            border: expanded ? `1px solid ${T.amber}66` : '1px solid transparent',
            borderRadius: 10,
            cursor: onToggleExpand ? 'pointer' : 'default',
            fontFamily: FONT,
            textAlign: 'left',
            color: 'inherit',
            WebkitTapHighlightColor: 'transparent',
            transition: 'border-color 180ms ease',
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
            {(() => {
              const src = pickAvatarSrc(rowAbove.friend_thumbnail_url, rowAbove.friend_profile_photo_url);
              return src ? (
                <img
                  src={src}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{initials(rowAbove.friend_name)}</span>
              );
            })()}
          </div>

          <div style={{ flex: 1, minWidth: 1 }}>
            <p
              style={{
                margin: 1,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: T.inkMute,
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
              {reformatFriendName(rowAbove.friend_name)} · #{(selfRank ?? 1) - 1}
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
                  fontSize: 22,
                  fontWeight: 800,
                  color: T.green,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                −{Math.abs(gap).toFixed(1)}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '1.44px',
                  color: T.inkFaded,
                }}
              >
                STROKES
              </p>
            </div>
            <span
              aria-hidden
              style={{
                fontSize: 14,
                color: T.inkFaded,
                marginLeft: 4,
                transition: 'transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
              }}
            >
              ▾
            </span>
          </div>
        </button>
      )}

      {rowAbove && expanded && (
        <RecentFormRegion
          friendConnectionId={rowAbove.friend_connection_id}
          friendName={firstName(rowAbove.friend_name)}
          friendHcpDelta={rowAbove.handicap_30d_delta}
        />
      )}

      <style>{`
        @keyframes heroFormExpand {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-heroExpand {
          animation: heroFormExpand 240ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }
      `}</style>
    </div>
  );
};

interface RecentFormRegionProps {
  friendConnectionId: string | null;
  friendName: string;
  friendHcpDelta: number | null;
}

const RecentFormRegion: React.FC<RecentFormRegionProps> = ({
  friendConnectionId,
  friendName,
  friendHcpDelta,
}) => {
  const isClbhouzFriend = !!friendConnectionId;
  const { data: rounds, isLoading, isError } = useFriendRecentRounds(
    friendConnectionId,
    5,
    isClbhouzFriend,
  );

  const formatDaysAgo = (playDate: string): string => {
    const days = Math.max(
      1,
      Math.round((Date.now() - new Date(playDate).getTime()) / 86400000),
    );
    if (days < 7) return `${days}d`;
    return `${Math.round(days / 7)}w`;
  };

  return (
    <div
      className="anim-heroExpand"
      style={{
        marginTop: 12,
        padding: '14px 12px 10px',
        background: T.bg2,
        borderRadius: 10,
        border: `1px solid ${T.line2}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.16em',
          color: T.inkMute,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {friendName.toUpperCase()}'S RECENT FORM
      </div>

      {!isClbhouzFriend && (
        <div
          style={{
            fontSize: 12,
            color: T.inkMute,
            padding: '12px 0',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Plot twist: {friendName}'s rounds are hidden — they haven't joined clbhouz yet
        </div>
      )}

      {isClbhouzFriend && isLoading && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            height: 40,
            alignItems: 'flex-end',
            marginBottom: 10,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flex: 1,
                height: 20,
                background: T.bg3,
                borderRadius: 3,
              }}
            />
          ))}
        </div>
      )}

      {isClbhouzFriend && !isLoading && !isError && (rounds == null || rounds.length === 0) && (
        <div
          style={{
            fontSize: 12,
            color: T.inkMute,
            padding: '12px 0',
            textAlign: 'center',
          }}
        >
          No recent rounds
        </div>
      )}


      {isClbhouzFriend && !isLoading && rounds && rounds.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 6,
              marginBottom: 10,
            }}
          >
            {rounds.map((r) => {
              const diff = r.handicap_differential ?? 0;
              const good = diff < 0;
              const h = Math.min(40, Math.max(8, Math.abs(diff) * 14));
              return (
                <div
                  key={r.score_id}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: h,
                      background: good
                        ? `linear-gradient(180deg, ${T.green} 0%, ${T.greenDeep} 100%)`
                        : T.red,
                      borderRadius: 3,
                      opacity: 0.85,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: T.inkMute,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {r.handicap_differential != null
                      ? diff > 0
                        ? `+${diff.toFixed(1)}`
                        : diff.toFixed(1)
                      : '—'}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.inkFaded }}>
                    {formatDaysAgo(r.play_date)}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTop: `1px solid ${T.line}`,
              fontSize: 11,
            }}
          >
            <div>
              <div style={{ color: T.inkMute, fontWeight: 600 }}>
                {rounds.length} round{rounds.length === 1 ? '' : 's'}
              </div>
              <div
                style={{
                  color: T.ink,
                  fontWeight: 700,
                  marginTop: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Avg{' '}
                <span
                  style={{
                    color: averageDiff(rounds) < 0 ? T.green : T.inkMute,
                  }}
                >
                  {averageDiff(rounds) < 0
                    ? averageDiff(rounds).toFixed(1)
                    : `+${averageDiff(rounds).toFixed(1)}`}
                </span>
              </div>
            </div>
            {friendHcpDelta != null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: T.inkMute, fontWeight: 600 }}>HCP 30d</div>
                <div
                  style={{
                    color: friendHcpDelta < 0 ? T.green : T.red,
                    fontWeight: 700,
                    marginTop: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {friendHcpDelta < 0
                    ? friendHcpDelta.toFixed(1)
                    : `+${friendHcpDelta.toFixed(1)}`}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

function averageDiff(rounds: FriendRecentRound[]): number {
  const diffs = rounds
    .map((r) => r.handicap_differential)
    .filter((d): d is number => d != null);
  if (diffs.length === 0) return 0;
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

export default HeroPositionCard;
