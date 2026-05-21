import React from 'react';
import { rankTier, daysSince, formatAttainedAt, NEW_BADGE_DAYS } from './_shared/helpers';

interface LeaderRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
}

interface Props {
  row: LeaderRow;
  unit: string;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const CompactLeaderRow: React.FC<Props> = ({ row, unit }) => {
  const isYou = row.isSelf;
  const tier = rankTier(row.rank);
  const isNew = daysSince(row.attained_at) < NEW_BADGE_DAYS;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 10px',
        fontFamily: FONT,
        background: isYou ? 'rgba(251,188,46,0.06)' : 'transparent',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: tier.bg,
          border: `1px solid ${tier.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800,
          color: tier.color,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.rank}
      </div>

      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--hcp-t-60)',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {row.photoUrl ? (
          <img
            src={row.photoUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          (row.name?.[0] ?? '?').toUpperCase()
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: isYou ? '#FBBC2E' : 'var(--hcp-t-100)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isYou ? 'YOU' : row.name}
          </div>
          {isNew && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: '#22C55E',
                background: 'rgba(34,197,94,0.14)',
                border: '1px solid rgba(34,197,94,0.30)',
                padding: '1px 5px',
                borderRadius: 4,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              New
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--hcp-t-40)', marginTop: 1 }}>
          {formatAttainedAt(row.attained_at)}
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: isYou ? '#FBBC2E' : 'var(--hcp-t-100)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          flexShrink: 0,
        }}
      >
        {row.valueDisplay}
        {unit && (
          <span style={{ fontSize: 9, color: 'var(--hcp-t-60)', marginLeft: 3, fontWeight: 600 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
