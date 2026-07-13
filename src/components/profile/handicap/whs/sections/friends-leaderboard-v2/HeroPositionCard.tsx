import React from 'react';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry, FriendLeaderboardRankDelta } from '@/lib/whs/types';

interface Props {
  /** The self row from the leaderboard cohort. */
  selfRow: FriendLeaderboardEntry | null;
  /** Row immediately above you in the active cohort. null when you're #1 or absent. */
  rowAbove: FriendLeaderboardEntry | null;
  /** Your 1-based rank in the active cohort. */
  selfRank: number | null;
  /** Total active count. */
  totalActive: number;
  /** Same friend-circle percentile the section header prints. */
  percentileTop: number | null;
  /** Your 30D rank movement (matches the per-row delta shape). */
  selfDelta?: FriendLeaderboardRankDelta;
  /** Retained for parent compatibility. */
  expanded?: boolean;
  onToggleExpand?: () => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
  /** When true, render flush (no outer card chrome) — used inside the merged leaderboard card. */
  embedded?: boolean;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const NUM: React.CSSProperties = { fontFamily: FONT, fontVariantNumeric: 'tabular-nums' };

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkFaded: 'var(--hcp-t-40)',
  bg3: 'var(--hcp-bg-3)',
  amber: '#F7931E',
  good: 'var(--hcp-good, #34D399)',
};

const MovementGlyph: React.FC<{ delta?: FriendLeaderboardRankDelta }> = ({ delta }) => {
  if (!delta) return null;
  const n = delta.rank_delta;
  if (delta.is_new) {
    return (
      <span style={{
        fontSize: 9, fontWeight: 800, color: T.amber,
        background: 'rgba(247,147,30,0.14)', padding: '1px 5px',
        borderRadius: 4, letterSpacing: '0.14em',
      }}>
        NEW
      </span>
    );
  }
  if (n == null) return null;
  if (n > 0) {
    return <span style={{ fontSize: 11, fontWeight: 800, color: T.good, ...NUM }}>▲{n}</span>;
  }
  if (n < 0) {
    return <span style={{ fontSize: 11, fontWeight: 800, color: T.inkMute, ...NUM }}>▼{Math.abs(n)}</span>;
  }
  return <span style={{ fontSize: 11, color: 'rgba(242,244,247,0.22)', fontWeight: 800 }}>—</span>;
};

export const HeroPositionCard: React.FC<Props> = ({
  selfRow,
  selfRank,
  totalActive,
  percentileTop,
  selfDelta,
}) => {
  if (!selfRow) return null;

  const yourHcp = selfRow.friend_handicap_index;
  const yourClub = selfRow.friend_home_club ?? null;
  const selfPhoto = pickAvatarSrc(selfRow.friend_thumbnail_url, selfRow.friend_profile_photo_url);
  const selfFbBg = getAvatarFallbackColor(
    selfRow.friend_user_id ?? (selfRow as any).friend_row_id ?? selfRow.friend_name
  );

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        fontFamily: FONT,
      }}
    >
      {/* Avatar 46 squircle */}
      <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            overflow: 'hidden',
            background: selfPhoto ? T.bg3 : selfFbBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
          }}
        >
          {selfPhoto ? (
            <img src={selfPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>{getInitialsFromName(selfRow.friend_name) || '?'}</span>
          )}
        </div>
        {/* Traced hairline overlay -- dark canon */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            border: '1px solid rgba(255,255,255,0.22)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Rank cluster + sub-line */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            color: T.ink, lineHeight: 1, ...NUM,
          }}>
            #{selfRank ?? '—'}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
            color: T.inkMute, ...NUM,
          }}>
            OF {totalActive}
          </span>
          {percentileTop != null && (
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
              color: T.amber, ...NUM,
            }}>
              TOP {percentileTop}%
            </span>
          )}
        </div>
        <p style={{
          margin: '4px 0 0', fontSize: 11.5, fontWeight: 500, color: T.inkFaded,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          HCP <span style={NUM}>{fmtHcp(yourHcp)}</span>
          {yourClub && <span> · {yourClub}</span>}
        </p>
      </div>

      {/* Right slot — your 30D movement */}
      <div style={{ flexShrink: 0, minWidth: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <MovementGlyph delta={selfDelta} />
      </div>
    </div>
  );
};

export default HeroPositionCard;
