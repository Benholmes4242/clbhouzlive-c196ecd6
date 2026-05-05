import React from 'react';
import { getScoreToParColours } from '@/lib/whs/utils/scoreToParColours';

interface Props {
  holeNo: number;
  par: number;
  strokes: number | null;
  size?: number;
}

const INK_MUTE = 'rgba(15,23,42,0.55)';
const INK_FAINT = 'rgba(15,23,42,0.35)';

export const RoundHoleCell: React.FC<Props> = ({ holeNo, par, strokes, size = 32 }) => {
  if (strokes === null || strokes === undefined) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          flexShrink: 0,
          opacity: 0.5,
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.08em' }}>
          {holeNo}
        </span>
        <span style={{ fontSize: 9, color: INK_FAINT }}>{par}</span>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 6,
            border: '1.5px dashed rgba(15,23,42,0.12)',
          }}
        />
      </div>
    );
  }

  const scoreToPar = strokes - par;
  const c = getScoreToParColours(scoreToPar);
  const borderRadius = c.isCircle ? '50%' : 6;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.08em' }}>
        {holeNo}
      </span>
      <span style={{ fontSize: 9, color: INK_FAINT }}>{par}</span>
      <div
        style={{
          width: size,
          height: size,
          borderRadius,
          border: c.dashed ? `1.5px dashed ${c.ring}` : `1.5px solid ${c.ring}`,
          background: c.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(c.doubleOutline
            ? { outline: `1px solid ${c.ring}`, outlineOffset: 1 }
            : {}),
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: c.text,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {strokes}
        </span>
      </div>
    </div>
  );
};

export default RoundHoleCell;
