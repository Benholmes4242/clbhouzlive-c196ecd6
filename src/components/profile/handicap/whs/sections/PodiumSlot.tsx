import React from 'react';
import { Crown } from 'lucide-react';

interface PodiumSlotProps {
  rank: 1 | 2 | 3;
  name: string;
  handicap: number | null;
  thumbnailUrl: string | null;
  isCurrentUser: boolean;
  isEmpty?: boolean;
}

const MEDAL = {
  1: '#D97706',
  2: '#64748B',
  3: '#A16207',
} as const;

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const PLINTH_HEIGHT = {
  1: 88,
  2: 64,
  3: 48,
} as const;

const AVATAR_SIZE = {
  1: 50,
  2: 44,
  3: 44,
} as const;

const fmtH = (n: number | null) => {
  if (n === null) return '—';
  return n >= 0 ? n.toFixed(1) : `\u2212${Math.abs(n).toFixed(1)}`;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const PodiumSlot: React.FC<PodiumSlotProps> = ({
  rank,
  name,
  handicap,
  thumbnailUrl,
  isCurrentUser,
  isEmpty = false,
}) => {
  const medalColor = MEDAL[rank];
  const plinthHeight = PLINTH_HEIGHT[rank];
  const avatarSize = AVATAR_SIZE[rank];

  const borderColor = isEmpty
    ? 'rgba(15,23,42,0.20)'
    : isCurrentUser
      ? '#F7931E'
      : medalColor;
  const plinthBg = isEmpty
    ? 'rgba(15,23,42,0.06)'
    : isCurrentUser
      ? `linear-gradient(180deg, ${medalColor} 0%, #F7931E 100%)`
      : medalColor;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        minWidth: 0,
      }}
    >
      {/* Crown over #1 only */}
      {rank === 1 && !isEmpty ? (
        <Crown size={16} fill="#D97706" stroke="#D97706" />
      ) : (
        <div style={{ height: 16 }} />
      )}

      {/* Avatar */}
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: 13,
          border: `2px ${isEmpty ? 'dashed' : 'solid'} ${borderColor}`,
          overflow: 'hidden',
          background: isEmpty ? 'transparent' : 'rgba(15,23,42,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isEmpty ? null : isCurrentUser ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#F7931E',
              letterSpacing: '0.06em',
            }}
          >
            YOU
          </span>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: medalColor,
            }}
          >
            {getInitials(name)}
          </span>
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: isEmpty ? '#94A3B8' : '#0F172A',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {isEmpty ? 'Empty' : name}
      </div>

      {/* Handicap */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 900,
          fontFamily: FONT_GEIST,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: isEmpty ? '#94A3B8' : '#0F172A',
          lineHeight: 1,
        }}
      >
        {isEmpty ? '—' : fmtH(handicap)}
      </div>

      {/* Plinth */}
      <div
        style={{
          width: '100%',
          height: plinthHeight,
          background: plinthBg,
          borderRadius: '6px 6px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
          border: isEmpty ? '1px dashed rgba(15,23,42,0.20)' : 'none',
          borderBottom: 'none',
        }}
      >
        <span
          style={{
            fontSize: isEmpty ? 11 : 22,
            fontWeight: 900,
            fontFamily: FONT_GEIST,
            color: isEmpty ? '#94A3B8' : '#fff',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {isEmpty ? 'Empty' : rank}
        </span>
      </div>
    </div>
  );
};

export default PodiumSlot;
