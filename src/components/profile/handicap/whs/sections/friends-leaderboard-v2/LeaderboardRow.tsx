import React from 'react';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
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

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
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
      fontWeight: 800,
      letterSpacing: '0.14em',
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
          fontWeight: 800,
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
  if (delta == null || delta === 0) {
    return <span style={{ fontSize: 11, color: 'rgba(242,244,247,0.22)', fontWeight: 800 }}>—</span>;
  }
  const climbed = delta > 0;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
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
  const Tag: any = onClick ? 'button' : 'div';

  const selfFrame: React.CSSProperties = isYou
    ? {
        border: '1px solid rgba(247,147,30,0.45)',
        borderRadius: 13,
        margin: '6px 6px',
        padding: '9px 14px',
      }
    : {
        border: 'none',
        borderBottom: `1px solid ${T.hairlineSoft}`,
        padding: '10px 16px',
      };

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      role={onClick ? undefined : 'listitem'}
      aria-label={`${displayName}${rank != null ? `, ranked ${rank}` : ''}, handicap ${fmtHcp(hcp)}${isStaleRow ? ', stale' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: isYou ? 'calc(100% - 12px)' : '100%',
        textAlign: 'left',
        background: 'transparent',
        opacity: isStaleRow ? 0.6 : 1,
        cursor: onClick ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
        ...selfFrame,
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 22,
          textAlign: 'center',
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 800,
          color: isYou ? T.amber : T.inkFaded,
          ...NUM,
        }}
      >
        {rank ?? '\u2014'}
      </div>

      {/* Avatar + name + home club */}
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
        {(() => {
          const avatarSrc = pickAvatarSrc(entry.friend_thumbnail_url, entry.friend_profile_photo_url);
          const fbBg = getAvatarFallbackColor(
            entry.friend_user_id ?? (entry as any).friend_row_id ?? entry.friend_name
          );
          return (
            <div
              style={{
                position: 'relative',
                width: 33,
                height: 33,
                borderRadius: '34%',
                overflow: 'hidden',
                background: avatarSrc ? T.bg3 : fbBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '-0.01em',
              }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{getInitialsFromName(entry.friend_name) || '?'}</span>
              )}
              {/* Traced hairline overlay -- dark surface canon; self-frame amber wraps row, not avatar */}
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
          );
        })()}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
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
                minWidth: 0,
              }}
            >
              {displayName}
            </p>
            {showFlame && <FlameIcon />}
          </div>
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
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isStaleRow && <StalePill />}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {entry.friend_home_club ?? (isYou ? 'No home club set' : '')}
            </span>
          </p>
        </div>
      </div>

      {/* 30D movement slot */}
      <div
        style={{
          width: 32,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
      <div style={{ width: 56, textAlign: 'right', flexShrink: 0 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: isYou ? T.amber : T.ink,
            ...NUM,
            letterSpacing: '-0.01em',
          }}
        >
          {fmtHcp(hcp)}
        </span>
      </div>
    </Tag>
  );
};

export default LeaderboardRow;
