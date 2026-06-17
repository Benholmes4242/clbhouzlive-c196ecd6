import React, { useMemo } from 'react';
import RoundHoleCell from './RoundHoleCell';
import type { WhsScoreHole } from '@/lib/whs/types';
import { nineSeverityTint } from './_shared/nineSeverityTint';

interface Props {
  holes: WhsScoreHole[];
  isNineHole: boolean;
  isLight?: boolean;
}

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const NineGrid: React.FC<{ label: string; holes: WhsScoreHole[]; isLast?: boolean }> = ({ label, holes, isLast }) => {
  const total = holes.reduce(
    (s, h) => s + (h.played ? (h.adjusted_gross ?? h.actual_gross ?? 0) : 0),
    0,
  );
  const par = holes.reduce((s, h) => s + (h.par ?? 0), 0);
  const toPar = total - par;
  const palette = nineSeverityTint(toPar);
  const toParLabel = toPar === 0 ? 'E' : `${toPar > 0 ? '+' : ''}${toPar}`;

  return (
    <div style={{ marginBottom: isLast ? 0 : 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            padding: '3px 9px',
            background: palette.bgTint,
            borderRadius: 999,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.numColor,
              fontFamily: FONT_GEIST,
              letterSpacing: '-0.02em',
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: palette.deltaColor,
              letterSpacing: '0.02em',
            }}
          >
            {toParLabel}
          </span>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
        {holes.map((h) => (
          <RoundHoleCell key={`s-${h.hole_no}`} hole={h} />
        ))}
      </div>
    </div>
  );
};

export const RoundScorecard: React.FC<Props> = ({ holes, isNineHole }) => {
  const sorted = useMemo(
    () => [...holes].sort((a, b) => a.hole_no - b.hole_no),
    [holes],
  );
  const front9 = sorted.filter((h) => h.hole_no <= 9);
  const back9 = isNineHole ? [] : sorted.filter((h) => h.hole_no > 9);

  return (
    <div style={{ padding: '14px 0 28px', fontFamily: FONT_GEIST }}>
      <div style={{ padding: '0 18px', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: '#FFFFFF',
            textTransform: 'uppercase',
          }}
        >
          SCORECARD
        </span>
      </div>
      <div style={{ padding: '0 18px' }}>
        <NineGrid label="Front 9" holes={front9} isLast={isNineHole || back9.length === 0} />
        {!isNineHole && back9.length > 0 && <NineGrid label="Back 9" holes={back9} isLast />}
      </div>
    </div>
  );
};

export default RoundScorecard;
