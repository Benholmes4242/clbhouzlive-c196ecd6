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
          ? 'linear-gradient(135deg, rgba(251,188,46,0.16) 0%, rgba(247,147,30,0.04) 50%, var(--hcp-bg-1) 100%)'
          : 'linear-gradient(135deg, rgba(251,188,46,0.11) 0%, rgba(247,147,30,0.02) 50%, var(--hcp-bg-1) 100%)',
        border: `1px solid ${isYou ? 'rgba(251,188,46,0.40)' : 'rgba(251,188,46,0.24)'}`,
        borderRadius: 16,
        padding: '16px 18px',
        fontFamily: FONT,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.35)',
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
              padding: '4px 10px',
              borderRadius: 999,
              background: 'linear-gradient(180deg, rgba(251,188,46,0.18), rgba(251,188,46,0.06))',
              border: '1px solid rgba(251,188,46,0.35)',
              fontSize: 9,
              fontWeight: 800,
              color: '#FBBC2E',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <Crown size={9.5} strokeWidth={2.4} />
            Champion
          </div>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: 'var(--hcp-t-40)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatHeldFor(days)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(251,188,46,0.45)',
              boxShadow: '0 0 0 4px rgba(251,188,46,0.06)',
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
                fontWeight: 700,
                color: isYou ? '#FBBC2E' : 'var(--hcp-t-100)',
                letterSpacing: '-0.015em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isYou ? 'YOU' : row.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', marginTop: 3 }}>
              Set {formatAttainedAt(row.attained_at)}
            </div>
          </div>

          <div
            style={{
              fontSize: 38,
              fontWeight: 200,
              color: isYou ? '#FBBC2E' : 'var(--hcp-t-100)',
              letterSpacing: '-0.05em',
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 0.9,
            }}
          >
            {row.valueDisplay}
            {unit && (
              <span
                style={{
                  fontSize: 10,
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
