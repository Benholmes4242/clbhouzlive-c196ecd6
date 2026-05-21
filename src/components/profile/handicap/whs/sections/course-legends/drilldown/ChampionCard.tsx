import React from 'react';
import { Crown, type LucideIcon } from 'lucide-react';
import { formatHeldFor, daysSince, formatAttainedAt } from './_shared/helpers';

interface ChampionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
}

interface Props {
  categoryIcon: LucideIcon;
  unit: string;
  row: ChampionRow;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const ChampionCard: React.FC<Props> = ({ categoryIcon: CatIcon, unit, row }) => {
  const isYou = row.isSelf;
  const days = daysSince(row.attained_at);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: isYou
          ? 'linear-gradient(135deg, rgba(251,188,46,0.14) 0%, var(--hcp-bg-1) 60%)'
          : 'linear-gradient(135deg, rgba(251,188,46,0.10) 0%, var(--hcp-bg-1) 70%)',
        border: `1px solid ${isYou ? 'rgba(251,188,46,0.45)' : 'rgba(251,188,46,0.30)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        fontFamily: FONT,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -16,
          bottom: -22,
          opacity: 0.07,
          color: '#FBBC2E',
          transform: 'rotate(-12deg)',
          pointerEvents: 'none',
        }}
      >
        <CatIcon size={110} strokeWidth={1.5} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(251,188,46,0.14)',
              border: '1px solid rgba(251,188,46,0.40)',
              fontSize: 9,
              fontWeight: 800,
              color: '#FBBC2E',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            <Crown size={10} strokeWidth={2.5} />
            Champion
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--hcp-t-60)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatHeldFor(days)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '2px solid rgba(251,188,46,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              color: 'var(--hcp-t-60)',
              fontSize: 18,
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
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: isYou ? '#FBBC2E' : 'var(--hcp-t-100)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isYou ? 'YOU' : row.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', marginTop: 2 }}>
              Set {formatAttainedAt(row.attained_at)}
            </div>
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: isYou ? '#FBBC2E' : 'var(--hcp-t-100)',
              letterSpacing: '-0.03em',
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {row.valueDisplay}
            {unit && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--hcp-t-60)',
                  marginLeft: 4,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
