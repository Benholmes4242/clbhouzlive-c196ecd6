import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  hole: WhsScoreHole;
  size?: number;
}

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const PAR_FILL_LIGHT = 'rgba(15,23,42,0.06)';

const HOLE_GOLD = '#D4A82A';
const EAGLE_GREEN = '#0E9F6E';
const BIRDIE_GREEN = '#10B981';
const BOGEY_RED = '#E11D48';
const DOUBLE_RED = '#9F1239';

const colourFor = (score: number, par: number): string => {
  if (score === 1) return HOLE_GOLD;
  const diff = score - par;
  if (diff <= -2) return EAGLE_GREEN;
  if (diff === -1) return BIRDIE_GREEN;
  if (diff === 0) return INK_55;
  if (diff === 1) return BOGEY_RED;
  return DOUBLE_RED;
};

const fillFor = (score: number, par: number): string => {
  if (score === 1) return 'rgba(212,168,42,0.14)';
  const diff = score - par;
  if (diff <= -2) return 'rgba(14,159,110,0.12)';
  if (diff === -1) return 'rgba(16,185,129,0.12)';
  if (diff === 0) return PAR_FILL_LIGHT;
  if (diff === 1) return 'rgba(225,29,72,0.10)';
  return 'rgba(159,18,57,0.12)';
};

export const RoundHoleCell: React.FC<Props> = ({ hole, size = 32 }) => {
  const strokes = hole.played
    ? (hole.adjusted_gross ?? hole.actual_gross ?? null)
    : null;
  const par = hole.par;

  if (strokes === null || strokes === undefined) {
    return (
      <div
        style={{
          width: '100%',
          height: size,
          borderRadius: 8,
          border: '1.5px dashed rgba(15,23,42,0.12)',
          opacity: 0.5,
        }}
      />
    );
  }

  const colour = colourFor(strokes, par);
  const fill = fillFor(strokes, par);
  const diff = strokes - par;
  const isPar = diff === 0;
  const isAce = strokes === 1;
  const isEaglePlus = diff <= -2;
  const showDot = isAce || isEaglePlus;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: size,
        borderRadius: 8,
        background: fill,
        border: isPar ? '1.5px solid transparent' : `1.5px solid ${colour}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: isPar ? INK : colour,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {strokes}
      </span>
      {showDot && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isAce ? HOLE_GOLD : EAGLE_GREEN,
            border: '1.5px solid #fff',
          }}
        />
      )}
    </div>
  );
};

export default RoundHoleCell;
