import { GAM } from '../../../gam/tokens';
import React from 'react';
import { Crown } from 'lucide-react';
import { daysSince, NEW_BADGE_DAYS } from './_shared/helpers';

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

const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";
const squircleMaskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

export const CompactLeaderRow: React.FC<Props> = ({ row }) => {
  const isYou = row.isSelf;
  const isChampion = row.rank === 1;
  const isNew = daysSince(row.attained_at) < NEW_BADGE_DAYS;

  const rowBg = isYou
    ? 'rgba(247,147,30,0.10)'
    : isChampion
      ? 'var(--hcp-bg-2)'
      : 'var(--hcp-bg-1)';
  const photoBg = row.photoUrl
    ? `url(${row.photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';

  const avatar = isChampion ? (
    <div style={{ width: 34, height: 34, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div style={{ position: 'absolute', inset: 0, background: photoBg, ...squircleMaskStyle }} />
      <div style={{ position: 'absolute', inset: 0, ...squircleMaskStyle, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)' }} />
    </div>
  ) : (
    <div
      aria-hidden
      style={{
        width: 34,
        height: 34,
        borderRadius: '34%',
        background: photoBg,
        boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)',
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '22px 34px 1fr auto',
        gap: 12,
        alignItems: 'center',
        padding: '9px 14px',
        background: rowBg,
        boxShadow: 'inset 0 -0.5px 0 rgba(15,23,42,0.07)',
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      {isChampion && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: GAM.GOLD,
          }}
        />
      )}

      {isChampion ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', lineHeight: 0 }} aria-label="Champion">
          <Crown size={14} strokeWidth={2.5} fill={GAM.GOLD} style={{ color: GAM.DEEP_AMBER, flexShrink: 0 }} />
        </div>
      ) : (
        <div
          style={{
            fontFamily: GAM.FONT_GEIST,
            fontSize: 14,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: '#b3bdca',
            lineHeight: 1,
            textAlign: 'right',
          }}
        >
          {row.rank}
        </div>
      )}

      {avatar}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: isChampion ? 800 : 600,
            color: isYou ? GAM.DEEP_AMBER : GAM.INK,
            letterSpacing: '-0.014em',
            lineHeight: 1.25,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: '100%',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isYou ? 'You' : row.name}
          </span>
          {isNew && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: '#16A34A',
                background: 'rgba(34,197,94,0.10)',
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
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span
          style={{
            fontFamily: GAM.FONT_GEIST,
            fontSize: 15,
            fontWeight: 700,
            color: isYou || isChampion ? GAM.DEEP_AMBER : GAM.INK,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {row.valueDisplay}
        </span>
      </div>
    </div>
  );
};
