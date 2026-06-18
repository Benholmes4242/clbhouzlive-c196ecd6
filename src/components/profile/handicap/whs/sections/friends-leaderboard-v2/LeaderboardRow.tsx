import React from 'react';
import { initials } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
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

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkSoft: 'var(--hcp-t-80)',
  inkFaded: 'var(--hcp-t-40)',
  ink25: 'var(--hcp-t-30)',
  hairline: 'var(--hcp-line-2)',
  hairlineSoft: 'var(--hcp-bg-3)',
  bg3: 'var(--hcp-bg-3)',
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.14)',
  amberInk: '#854F0B',
  amberTint: 'rgba(247,147,30,0.10)',
  gold: '#FBBC2E',
  silver: '#C0C5CF',
  bronze: '#C97D45',
};

const medalColor = (rank: number | null): string => {
  if (rank === 1) return T.gold;
  if (rank === 2) return T.silver;
  if (rank === 3) return T.bronze;
  return T.inkMute;
};

const FlameIcon: React.FC<{ size?: number }> = ({ size = 11 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#F7931E"
    aria-hidden
    style={{ flexShrink: 0 }}
  >
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
}

const RankDeltaChip: React.FC<RankDeltaChipProps> = ({ delta, isNew, isStale }) => {
  if (isStale) {
    return <span style={{ fontSize: 11, color: T.ink25, fontWeight: 700 }}>—</span>;
  }
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
  if (delta == null || delta === 0) {
    return <span style={{ fontSize: 11, color: T.ink25, fontWeight: 700 }}>—</span>;
  }
  const climbed = delta > 0;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: climbed ? '#059669' : '#9F1D1D',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <span style={{ fontSize: 9 }}>{climbed ? '↑' : '↓'}</span>
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
        width: '100%',
        margin: 0,
        textAlign: 'left',
        padding: '10px 20px',
        borderBottom: `1px solid ${T.hairlineSoft}`,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
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
          color: medalColor(rank),
          fontVariantNumeric: 'tabular-nums',
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
        <div
          style={{
            width: 33,
            height: 33,
            borderRadius: '34%',
            overflow: 'hidden',
            background: T.bg3,
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
          {(() => {
            const avatarSrc = pickAvatarSrc(entry.friend_thumbnail_url, entry.friend_profile_photo_url);
            return avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{initials(entry.friend_name)}</span>
            );
          })()}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
            }}
          >
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

      {/* 30D slot — Phase 3 rank delta chip */}
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
        />
      </div>

      {/* HCP */}
      <div
        style={{
          width: 56,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: (rank === 1 || isYou) ? T.amber : T.ink,
            fontVariantNumeric: 'tabular-nums',
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
