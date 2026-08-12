import React from 'react';
import { useTranslation } from 'react-i18next';
import { FONT, INK } from './_constants';
import { INK_MUTE } from '@/features/courses/_shared/tokens';

const AMBER = '#F7931E';
const GOLD = '#F5B301';

interface Props {
  birdiedCount: number;
  totalHoles: number;
}

export const BirdieMapSummary: React.FC<Props> = ({ birdiedCount, totalHoles }) => {
  const { t } = useTranslation(['courses']);
  const pct = totalHoles > 0 ? Math.min(1, birdiedCount / totalHoles) : 0;
  return (
    <div
      style={{
        margin: '4px 16px 8px',
        padding: '10px 12px',
        borderRadius: 12,
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.005em',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: GOLD,
              boxShadow: '0 0 0 2px #ffffff',
              display: 'inline-block',
            }}
          />
          {t('courses:holes.birdiedOfTotal', { n: birdiedCount, total: totalHoles })}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: INK_MUTE,
            textTransform: 'uppercase',
          }}
        >
          {t('courses:holes.yourBirdieMap')}
        </span>
      </div>
      <div
        aria-hidden
        style={{
          marginTop: 8,
          width: '100%',
          height: 4,
          borderRadius: 4,
          background: 'rgba(15,23,42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
            transition: 'width 240ms ease',
          }}
        />
      </div>
    </div>
  );
};

export default BirdieMapSummary;
