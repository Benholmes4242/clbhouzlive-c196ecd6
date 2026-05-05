import React from 'react';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  entry: FriendLeaderboardEntry;
  isActive: boolean;
  onClick?: () => void;
}

function firstName(name: string): string {
  if (!name) return '';
  if (name.includes(',')) {
    const parts = name.split(',');
    return (parts[1] ?? '').trim().split(' ')[0] || parts[0].trim();
  }
  return name.trim().split(' ')[0];
}

function initials(name: string): string {
  const display = name.includes(',')
    ? name.split(',').reverse().join(' ').trim()
    : name.trim();
  return display
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const RecentlyActiveItem: React.FC<Props> = ({ entry, isActive, onClick }) => {
  const display = firstName(entry.friend_name);

  return (
    <button
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 76,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        {entry.friend_thumbnail_url ? (
          <img
            src={entry.friend_thumbnail_url}
            alt={display}
            style={{
              width: 60,
              height: 60,
              borderRadius: '34%',
              objectFit: 'cover',
              border: '1px solid rgba(15,23,42,0.08)',
              background: '#F1F5F9',
            }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '34%',
              background: '#E2E8F0',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              border: '1px solid rgba(15,23,42,0.08)',
            }}
          >
            {initials(entry.friend_name)}
          </div>
        )}
        {isActive && (
          <span
            aria-label="Active in last 7 days"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#22C55E',
              border: '2px solid #F8FAFC',
            }}
          />
        )}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '-0.01em',
          maxWidth: 76,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {display}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          color: '#64748B',
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmtHcp(entry.friend_handicap_index)}
      </p>
    </button>
  );
};

export default RecentlyActiveItem;
