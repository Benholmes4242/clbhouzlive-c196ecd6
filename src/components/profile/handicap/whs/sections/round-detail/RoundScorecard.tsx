import React, { useMemo } from 'react';
import RoundHoleCell from './RoundHoleCell';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  holes: WhsScoreHole[];
  isNineHole: boolean;
}

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const AMBER_DEEP = '#C97211';

const NineGrid: React.FC<{
  label: string;
  holes: WhsScoreHole[];
}> = ({ label, holes }) => {
  const total = holes.reduce(
    (s, h) =>
      s +
      (h.played ? (h.adjusted_gross ?? h.actual_gross ?? 0) : 0),
    0,
  );
  const par = holes.reduce((s, h) => s + (h.par ?? 0), 0);
  const toPar = total - par;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          padding: '0 2px',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: INK,
            letterSpacing: '0.22em',
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
            padding: '4px 10px',
            background: 'rgba(15,23,42,0.04)',
            borderRadius: 999,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.02em',
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: toPar > 0 ? AMBER_DEEP : toPar < 0 ? '#10B981' : INK_55,
              letterSpacing: '-0.01em',
            }}
          >
            {toPar === 0 ? 'E' : `${toPar > 0 ? '+' : ''}${toPar}`}
          </span>
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: 4,
        }}
      >
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
    <div style={{ padding: '14px 16px 0' }}>
      <NineGrid label="Front 9" holes={front9} />
      {!isNineHole && back9.length > 0 && (
        <NineGrid label="Back 9" holes={back9} />
      )}
    </div>
  );
};

export default RoundScorecard;
