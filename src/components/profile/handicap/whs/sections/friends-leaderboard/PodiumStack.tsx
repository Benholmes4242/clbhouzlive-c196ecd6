import React from 'react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import type { LeaderboardItem } from './FriendsLeaderboardV2';

interface Props {
  /** [slot2, slot1, slot3] in display order — visually 2 · 1 · 3 */
  slots: [LeaderboardItem | null, LeaderboardItem | null, LeaderboardItem | null];
  rivalId: string | null;
  currentUserName: string;
}

const HEIGHTS = { 1: 96, 2: 76, 3: 64 } as const;
const COLOURS = {
  1: { bg: 'rgba(247,147,30,0.10)', ring: '#F7931E', ink: '#C97211' },
  2: { bg: 'rgba(15,23,42,0.06)', ring: 'rgba(15,23,42,0.30)', ink: 'rgba(15,23,42,0.78)' },
  3: { bg: 'rgba(15,23,42,0.06)', ring: 'rgba(15,23,42,0.20)', ink: 'rgba(15,23,42,0.78)' },
} as const;
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const AMBER = '#F7931E';

const PodiumSlotEl: React.FC<{
  slot: LeaderboardItem | null;
  rank: 1 | 2 | 3;
  currentUserName: string;
}> = ({ slot, rank, currentUserName }) => {
  const c = COLOURS[rank];
  const h = HEIGHTS[rank];

  if (!slot) {
    return (
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'rgba(15,23,42,0.04)',
            margin: '0 auto 8px',
          }}
        />
        <div
          style={{
            height: h,
            background: 'rgba(15,23,42,0.04)',
            borderRadius: 12,
            margin: '0 6px',
          }}
        />
      </div>
    );
  }

  const isSelf = slot.kind === 'self';
  const handicap = isSelf ? slot.handicap : slot.friend.friend_handicap_index;
  const fullName = isSelf ? currentUserName : slot.friend.friend_name;
  const avatarUrl = isSelf ? null : slot.friend.friend_thumbnail_url;

  return (
    <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          overflow: 'hidden',
          background: isSelf ? 'rgba(247,147,30,0.12)' : 'rgba(15,23,42,0.06)',
          border: isSelf ? `1.5px solid ${AMBER}` : 'none',
          margin: '0 auto',
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
              fontSize: 12,
              fontWeight: 800,
              color: isSelf ? AMBER : '#64748B',
              letterSpacing: '0.04em',
            }}
          >
            {isSelf ? 'YOU' : initials(fullName)}
          </span>
        )}
      </div>
      <p
        style={{
          margin: '8px 0 2px',
          fontSize: 11,
          fontWeight: 700,
          color: INK,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {isSelf ? 'You' : firstName(fullName)}
      </p>
      <div
        style={{
          height: h,
          background: c.bg,
          borderTop: `2px solid ${c.ring}`,
          borderRadius: 12,
          margin: '6px 6px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 4px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 9,
            fontWeight: 900,
            color: c.ink,
            letterSpacing: '0.16em',
            marginBottom: 2,
          }}
        >
          #{rank}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: rank === 1 ? 22 : 18,
            fontWeight: 800,
            color: INK,
            fontFamily: FONT_DISPLAY,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {handicap !== null && handicap !== undefined ? handicap.toFixed(1) : '—'}
        </p>
      </div>
    </div>
  );
};

export const PodiumStack: React.FC<Props> = ({ slots, currentUserName }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        padding: '8px 12px 16px',
      }}
    >
      <PodiumSlotEl slot={slots[0]} rank={2} currentUserName={currentUserName} />
      <PodiumSlotEl slot={slots[1]} rank={1} currentUserName={currentUserName} />
      <PodiumSlotEl slot={slots[2]} rank={3} currentUserName={currentUserName} />
    </div>
  );
};

export default PodiumStack;
