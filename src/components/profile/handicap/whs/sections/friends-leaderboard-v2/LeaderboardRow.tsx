import React from 'react';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import { DARK_ROW_TITLE } from '../_shared/darkAtoms';

import type { FriendLeaderboardEntry, FriendLeaderboardRankDelta } from '@/lib/whs/types';

interface Props {
  entry: FriendLeaderboardEntry;
  rank: number | null;
  /** True when this friend hasn't played in 90 days. Always false for self. */
  isStaleRow: boolean;
  onClick?: () => void;
  /** Phase 3: rank movement chip data, undefined if not loaded yet. */
  rankDelta?: FriendLeaderboardRankDelta;
}

// Literal dark handicap tokens — this row renders inside a portalled
// BottomSheet (outside `.hcp-dark`) as well as on-page. `var(--hcp-*)`
// resolves to nothing in the portal scope, so we hardcode the exact
// values from handicap-dark.css.
const T = {
  ink: 'rgba(255,255,255,0.96)',      // --hcp-t-100
  inkMute: 'rgba(255,255,255,0.55)',  // --hcp-t-60
  inkFaded: 'rgba(255,255,255,0.38)', // --hcp-t-40
  ink25: 'rgba(255,255,255,0.30)',    // --hcp-t-30
  hairline: 'rgba(255,255,255,0.06)', // --hcp-line
  hairlineSoft: '#272C37',            // --hcp-bg-3
  bg3: '#272C37',                     // --hcp-bg-3
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.14)',
  amberInk: '#854F0B',
  good: '#34D399',                    // GOOD-BRIGHT (movement glyph)
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const NUM: React.CSSProperties = { fontFamily: FONT, fontVariantNumeric: 'tabular-nums' };

const FlameIcon: React.FC<{ size?: number }> = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F7931E" aria-hidden style={{ flexShrink: 0 }}>
    <path d="M12 2c.4 3 2 5 4 7 2 2 3 4 3 7a7 7 0 1 1-14 0c0-2 1-4 2-5 0 2 1 3 2 3 0-3 1-7 3-12Z" />
  </svg>
);

const StalePill: React.FC = () => (
  <span
    style={{
      background: T.amberSoft,
      color: T.amberInk,
      padding: '1px 5px',
      borderRadius: 4,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.14em',
      flexShrink: 0,
      overflowWrap: 'normal',
      whiteSpace: 'nowrap',
    }}
  >
    STALE
  </span>
);

interface RankDeltaChipProps {
  delta: number | null;
  isNew: boolean;
  isStale: boolean;
  hasDelta: boolean;
}

const RankDeltaChip: React.FC<RankDeltaChipProps> = ({ delta, isNew, isStale, hasDelta }) => {
  if (isStale) return null;
  if (isNew) {
    return (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: T.amber,
          background: T.amberSoft,
          padding: '1px 5px',
          borderRadius: 4,
          letterSpacing: '0.14em',
        }}
      >
        NEW
      </span>
    );
  }
  // Unknown movement — leave the slot empty (nothing, not a dash).
  if (!hasDelta) return null;
  // A HELD position renders nothing either: the slot stays empty so the
  // columns keep their alignment.
  if (delta == null || delta === 0) return null;
  const climbed = delta > 0;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: climbed ? T.good : T.inkMute,
        ...NUM,
        letterSpacing: '-0.01em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {climbed ? '▲' : '▼'}
      {Math.abs(delta)}
    </span>
  );
};

export const LeaderboardRow: React.FC<Props> = ({ entry, rank, isStaleRow, onClick, rankDelta }) => {
  const isYou = entry.is_self;
  const displayName = isYou ? 'You' : reformatFriendName(entry.friend_name);
  const hcp = entry.friend_handicap_index;
  const showFlame =
    !isStaleRow &&
    entry.handicap_30d_delta != null &&
    entry.handicap_30d_delta <= -0.5;
  const Tag: React.ElementType = onClick ? 'button' : 'div';

  /* The member is marked by a WASH, not a frame. The negative horizontal
     margin is matched by equal padding so the wash reaches the container's
     sides whatever its own padding is. No row carries a border or a rule. */
  const SIDE = 16;
  const wash: React.CSSProperties = isYou
    ? {
        background: 'rgba(247,147,30,0.07)',
        marginLeft: -SIDE,
        marginRight: -SIDE,
        paddingLeft: SIDE,
        paddingRight: SIDE,
        // width must grow by BOTH insets, otherwise `width: 100%` measures the
        // parent's content box: the wash reaches the left edge but stops 16px
        // short on the right, and every column shifts left with it.
        width: `calc(100% + ${SIDE * 2}px)`,
      }
    : {};


  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      role={onClick ? undefined : 'listitem'}
      aria-label={`${displayName}${rank != null ? `, ranked ${rank}` : ''}, handicap ${fmtHcp(hcp)}${isStaleRow ? ', stale' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        width: '100%',
        padding: '11px 0',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        opacity: isStaleRow ? 0.6 : 1,
        cursor: onClick ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
        ...wash,
      }}
    >
      {/* Rank — the one place amber belongs on this row */}
      <div
        style={{
          width: 16,
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          lineHeight: '30px',
          color: isYou ? T.amber : T.inkFaded,
          ...NUM,
        }}
      >
        {rank ?? ''}
      </div>

      {/* Avatar */}
      {(() => {
        const avatarSrc = pickAvatarSrc(entry.friend_thumbnail_url, entry.friend_profile_photo_url);
        const fbBg = getAvatarFallbackColor(
          entry.friend_user_id ?? (entry as { friend_row_id?: string | null }).friend_row_id ?? entry.friend_name
        );
        return (
          <div
            style={{
              position: 'relative',
              width: 30,
              height: 30,
              borderRadius: 10,
              overflow: 'hidden',
              background: avatarSrc ? T.bg3 : fbBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{getInitialsFromName(entry.friend_name) || '?'}</span>
            )}
            {/* Traced hairline overlay — dark surface canon */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.22)',
                pointerEvents: 'none',
              }}
            />
          </div>
        );
      })()}

      {/* Name + club — both WRAP, neither truncates */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
          <p
            style={{
              ...DARK_ROW_TITLE,
              // DARK_ROW_TITLE's colour is a var(--hcp-*) token, which does
              // not resolve in the portalled sheet. Numbers are shared; the
              // colour is literal.
              color: T.ink,
              margin: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {displayName}
          </p>
          {showFlame && <FlameIcon />}
        </div>
        {(isStaleRow || entry.friend_home_club || isYou) && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              lineHeight: 1.5,
              color: isStaleRow ? T.amberInk : T.inkMute,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              overflowWrap: 'anywhere',
            }}
          >
            {isStaleRow && <StalePill />}
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              {entry.friend_home_club ?? (isYou ? 'No home club set' : '')}
            </span>
          </p>
        )}
      </div>

      {/* 30D movement slot */}
      <div
        style={{
          width: 26,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          minHeight: 30,
        }}
      >
        <RankDeltaChip
          delta={rankDelta?.rank_delta ?? null}
          isNew={rankDelta?.is_new ?? false}
          isStale={isStaleRow}
          hasDelta={rankDelta !== undefined}
        />
      </div>

      {/* HCP */}
      <div style={{ width: 42, textAlign: 'right', flexShrink: 0, lineHeight: '30px' }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: isYou ? T.amber : T.ink,
            ...NUM,
            letterSpacing: '-0.03em',
          }}
        >
          {fmtHcp(hcp)}
        </span>
      </div>
    </Tag>
  );
};


export default LeaderboardRow;
