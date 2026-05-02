import React, { useMemo } from 'react';
import RoundHoleCell from './RoundHoleCell';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  holes: WhsScoreHole[];
  isNineHole: boolean;
}

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';

const fmtToPar = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`);

const RowHeader: React.FC<{ label: string; strokes: number; par: number }> = ({
  label,
  strokes,
  par,
}) => {
  const toPar = strokes - par;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: '0 20px',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 800,
          color: INK_MUTE,
          letterSpacing: '0.18em',
        }}
      >
        {label}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 800,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {strokes}{' '}
        <span style={{ color: INK_MUTE, fontWeight: 600 }}>({fmtToPar(toPar)})</span>
      </p>
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

  const sumStrokes = (rows: WhsScoreHole[]) =>
    rows.reduce((acc, h) => {
      const strokes = h.adjusted_gross ?? h.actual_gross ?? 0;
      return acc + (h.played ? strokes : 0);
    }, 0);
  const sumPar = (rows: WhsScoreHole[]) => rows.reduce((acc, h) => acc + h.par, 0);

  const front9Strokes = sumStrokes(front9);
  const front9Par = sumPar(front9);
  const back9Strokes = sumStrokes(back9);
  const back9Par = sumPar(back9);

  const rowStyles: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    paddingBottom: 4,
    paddingLeft: 20,
    paddingRight: 20,
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  };

  return (
    <div style={{ marginTop: 8 }}>
      <RowHeader label="FRONT 9" strokes={front9Strokes} par={front9Par} />
      <div style={rowStyles}>
        {front9.map((h) => (
          <RoundHoleCell
            key={h.hole_no}
            holeNo={h.hole_no}
            par={h.par}
            strokes={h.played ? (h.adjusted_gross ?? h.actual_gross ?? null) : null}
          />
        ))}
      </div>

      {!isNineHole && back9.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <RowHeader label="BACK 9" strokes={back9Strokes} par={back9Par} />
          <div style={rowStyles}>
            {back9.map((h) => (
              <RoundHoleCell
                key={h.hole_no}
                holeNo={h.hole_no}
                par={h.par}
                strokes={h.played ? (h.adjusted_gross ?? h.actual_gross ?? null) : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundScorecard;
