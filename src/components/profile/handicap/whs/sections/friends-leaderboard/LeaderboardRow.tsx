import React from 'react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import type { LeaderboardItem } from './FriendsLeaderboardV2';

interface Props {
  item: LeaderboardItem;
  rank: number;
  isRival?: boolean;
  isPinned?: boolean;
  onClick: () => void;
}

const HAIRLINE = '1px solid rgba(15,23,42,0.10)';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const AMBER = '#F7931E';
const AMBER_INK = '#9A6116';
const FONT_SERIF = 'Georgia, "Iowan Old Style", "Apple Garamond", serif';

const fmtRel = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export const LeaderboardRow: React.FC<Props> = ({
  item,
  rank,
  isRival = false,
  isPinned = false,
  onClick,
}) => {
  const isSelf = item.kind === 'self';
  const handicap =
    item.kind === 'self' ? item.handicap : item.friend.friend_handicap_index;
  const fullName = item.kind === 'self' ? item.name : item.friend.friend_name;
  const club = item.kind === 'self' ? null : item.friend.friend_home_club;
  const lastRound =
    item.kind === 'friend' ? fmtRel(item.friend.last_round_played_at) : '';
  const avatarUrl = item.kind === 'friend' ? item.friend.friend_thumbnail_url : null;

  return (
    <button
      onClick={onClick}
      disabled={isSelf}
      style={{
        width: '100%',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        border: 'none',
        borderBottom: HAIRLINE,
        background: isSelf ? 'rgba(247,147,30,0.05)' : '#FFFFFF',
        position: 'relative',
        cursor: isSelf ? 'default' : 'pointer',
      }}
    >
      {(isSelf || isPinned) && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: AMBER,
          }}
        />
      )}

      <span
        style={{
          width: 22,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 900,
          fontFamily: FONT_SERIF,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: isSelf ? AMBER_INK : 'rgba(15,23,42,0.45)',
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          overflow: 'hidden',
          flexShrink: 0,
          background: isSelf ? 'rgba(247,147,30,0.12)' : 'rgba(15,23,42,0.06)',
          border: isSelf ? `1.5px solid ${AMBER}` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!isSelf && avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: isSelf ? AMBER : '#64748B',
              letterSpacing: '0.04em',
            }}
          >
            {isSelf ? 'YOU' : initials(fullName)}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isSelf ? 'You' : firstName(fullName)}
          {isRival && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 9,
                fontWeight: 900,
                color: AMBER_INK,
                letterSpacing: '0.14em',
              }}
            >
              · RIVAL
            </span>
          )}
        </p>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 11,
            color: INK_MUTE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {club ?? '—'}
          {lastRound && ` · ${lastRound}`}
        </p>
      </div>

      <span
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {handicap !== null && handicap !== undefined ? handicap.toFixed(1) : '—'}
      </span>
    </button>
  );
};

export default LeaderboardRow;
