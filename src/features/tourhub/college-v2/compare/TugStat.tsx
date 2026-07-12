/**
 * TugStat — one head-to-head stat row.
 *
 * Layout:  [leftValue]   STAT LABEL   [rightValue]
 *          [------- tug bar ------ 2px gap ------]
 *
 * Bar geometry: 4px high, radius 2, split at l/(l+r). Winning half uses
 * a gold gradient oriented toward the center; losing half is neutral.
 * Both-zero → both halves faint ink tint + values ink.
 */

import { memo } from 'react';
import {
  FONT,
  INK,
  INK_MUTE,
  GOLD,
} from '@/features/tourhub/_shared/tokens';

interface Props {
  label: string;
  leftValue: number;
  rightValue: number;
  /** how to render the numeric value */
  format: (n: number) => string;
}

const GOLD_GRAD_START = '#B36B00';
const GOLD_GRAD_END = '#F5D061';
const LOSING = '#AEB4BC';
const BOTH_ZERO = 'rgba(15,23,42,0.05)';

function TugStatInner({ label, leftValue, rightValue, format }: Props) {
  const total = leftValue + rightValue;
  const bothZero = total <= 0;
  const leftFrac = bothZero ? 0.5 : leftValue / total;
  const rightFrac = 1 - leftFrac;

  const leftWinning = !bothZero && leftValue > rightValue;
  const rightWinning = !bothZero && rightValue > leftValue;

  const leftBg = bothZero
    ? BOTH_ZERO
    : leftWinning
    ? `linear-gradient(90deg, ${GOLD_GRAD_START} 0%, ${GOLD_GRAD_END} 100%)`
    : LOSING;
  const rightBg = bothZero
    ? BOTH_ZERO
    : rightWinning
    ? `linear-gradient(270deg, ${GOLD_GRAD_START} 0%, ${GOLD_GRAD_END} 100%)`
    : LOSING;

  const leftColor = bothZero ? INK : leftWinning ? GOLD : INK;
  const rightColor = bothZero ? INK : rightWinning ? GOLD : INK;

  return (
    <div style={{ padding: '12px 16px 12px', fontFamily: FONT }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 200,
            color: leftColor,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'left',
          }}
        >
          {format(leftValue)}
        </div>
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            color: INK_MUTE,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 200,
            color: rightColor,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
          }}
        >
          {format(rightValue)}
        </div>
      </div>

      {/* Tug bar */}
      <div style={{ display: 'flex', alignItems: 'center', height: 4, gap: 2 }}>
        <div
          aria-hidden
          style={{
            width: `calc(${leftFrac * 100}% - 1px)`,
            height: 4,
            borderRadius: 2,
            background: leftBg,
            minWidth: bothZero ? 0 : leftValue > 0 ? 4 : 0,
          }}
        />
        <div
          aria-hidden
          style={{
            width: `calc(${rightFrac * 100}% - 1px)`,
            height: 4,
            borderRadius: 2,
            background: rightBg,
            minWidth: bothZero ? 0 : rightValue > 0 ? 4 : 0,
          }}
        />
      </div>
    </div>
  );
}

export const TugStat = memo(TugStatInner);
export default TugStat;
