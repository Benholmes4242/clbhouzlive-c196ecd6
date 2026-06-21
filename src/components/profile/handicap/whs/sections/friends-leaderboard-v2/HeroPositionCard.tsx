import React from 'react';
import { firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
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
  /** Phase 3: expand state — controlled by the section. */
  expanded?: boolean;
  /** Phase 3: tap handler for the catch-strip. */
  onToggleExpand?: () => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
  /** When true, render flush (no outer card chrome) — used inside the merged leaderboard card. */
  embedded?: boolean;
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
  embedded = false,
}) => {
  // Always called — never short-circuit a hook with `if (!selfRow) return null`.
  const userId = selfRow?.friend_user_id ?? undefined;
  const percentileQuery = useHandicapPercentile(userId);

  if (!selfRow) return null;

  const yourHcp = selfRow.friend_handicap_index;
  const yourClub = selfRow.friend_home_club ?? null;
  const selfPhoto = pickAvatarSrc(selfRow.friend_thumbnail_url, selfRow.friend_profile_photo_url);
  const selfFbBg = getAvatarFallbackColor(
    selfRow.friend_user_id ?? (selfRow as any).friend_row_id ?? selfRow.friend_name
  );

  const percentileTop =
    percentileQuery.data?.available === true ? percentileQuery.data.percentile_top : null;

  // Gap-to-catch math
  const aboveHcp = rowAbove?.friend_handicap_index ?? null;
  const gap =
    yourHcp != null && aboveHcp != null ? Number((aboveHcp - yourHcp).toFixed(1)) : null;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '14px 16px',
        fontFamily: FONT,
      }}
    >
      {/* Avatar — plain, no glow */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          overflow: 'hidden',
          flexShrink: 0,
          background: selfPhoto ? T.bg3 : selfFbBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 16,
          fontWeight: 800,
        }}
      >
        {selfPhoto ? (
          <img src={selfPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{getInitialsFromName(selfRow.friend_name) || '?'}</span>
        )}
      </div>

      {/* Rank + percentile + hcp/club */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            #{selfRank ?? '—'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.inkMute, fontVariantNumeric: 'tabular-nums' }}>
            of {totalActive}
          </span>
          {percentileTop != null && percentileTop <= 50 && (
            <span style={{ marginLeft: 2, background: T.amberSoft, color: T.amber, padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>
              TOP {percentileTop}%
            </span>
          )}
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 500, color: T.inkMute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          HCP <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtHcp(yourHcp)}</span>
          {yourClub && <span> · {yourClub}</span>}
        </p>
      </div>

      {/* Catch gap — inline, compact (no expand) */}
      {rowAbove && gap != null && (
        <div style={{ flexShrink: 0, textAlign: 'right', paddingLeft: 10, borderLeft: `1px solid ${T.line2}` }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: T.inkMute, textTransform: 'uppercase' }}>
            Catch {firstName(rowAbove.friend_name)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 800, color: T.green, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
            −{Math.abs(gap).toFixed(1)}
          </p>
          <p style={{ margin: '1px 0 0', fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', color: T.inkFaded }}>
            STROKES
          </p>
        </div>
      )}
    </div>
  );
};

export default HeroPositionCard;
