import React, { useMemo } from 'react';
import RoundHoleCell from './RoundHoleCell';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  holes: WhsScoreHole[];
  isNineHole: boolean;
}

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = '#0F172A';
const INK_45 = 'rgba(15,23,42,0.45)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const GREEN = '#10B981';

const NineGrid: React.FC<{ label: string; holes: WhsScoreHole[] }> = ({ label, holes }) => {
  const total = holes.reduce(
    (s, h) => s + (h.played ? (h.adjusted_gross ?? h.actual_gross ?? 0) : 0),
    0,
  );
  const par = holes.reduce((s, h) => s + (h.par ?? 0), 0);
  const toPar = total - par;
  const toParColor = toPar > 0 ? AMBER_DEEP : toPar < 0 ? GREEN : INK_45;
  const toParLabel = toPar === 0 ? 'E' : `${toPar > 0 ? '+' : ''}${toPar}`;

  return (
    <div style={{ marginBottom: 14 }}>
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
            color: INK,
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
            background: 'rgba(15,23,42,0.04)',
            borderRadius: 999,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              fontFamily: FONT_MONO,
              letterSpacing: '-0.02em',
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: toParColor,
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
    <div style={{ padding: '18px 0 6px', fontFamily: FONT_GEIST }}>
      <div style={{ padding: '0 18px', marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: AMBER,
            textTransform: 'uppercase',
          }}
        >
          SCORECARD
        </span>
      </div>
      <div style={{ padding: '0 18px' }}>
        <NineGrid label="Front 9" holes={front9} />
        {!isNineHole && back9.length > 0 && <NineGrid label="Back 9" holes={back9} />}
      </div>
    </div>
  );
};

export default RoundScorecard;
