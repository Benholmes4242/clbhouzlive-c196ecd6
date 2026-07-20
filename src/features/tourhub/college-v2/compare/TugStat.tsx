/**
 * TugStat — one head-to-head stat row.
 *
 * Layout:  [leftValue]   STAT LABEL   [rightValue]
 *          [------- tug bar ------ 2px gap ------]
 *
 * Bar geometry: 4px high, radius 2, split at l/(l+r). Winning half uses an
 * amber gradient oriented toward the center; losing half is neutral.
 * Both-zero → both halves faint ink tint + values ink.
 *
 * `lowerWins` inverts the winner logic (Scoring Average: lower is better).
 * Zero is treated as "no data" and never wins under lowerWins.
 *
 * Amber (#F7931E) is used here because gold is reserved for the aces /
 * albatross register app-wide; head-to-head dominance is amber's job.
 */

import { memo } from 'react';
import {
  FONT,
  INK,
  INK_MUTE,
} from '@/features/tourhub/_shared/tokens';

interface Props {
  label: string;
  leftValue: number;
  rightValue: number;
  /** how to render the numeric value */
  format: (n: number) => string;
  /** When true, the smaller (non-zero) value wins. Default false. */
  lowerWins?: boolean;
}

const AMBER_GRAD_START = '#D97706';
const AMBER_GRAD_END = '#F7931E';
const AMBER_WIN_VALUE = '#F7931E';
const LOSING = '#AEB4BC';
const BOTH_ZERO = 'rgba(15,23,42,0.05)';

function TugStatInner({ label, leftValue, rightValue, format, lowerWins = false }: Props) {
  const bothZero = leftValue <= 0 && rightValue <= 0;

  let leftWinning = false;
  let rightWinning = false;
  if (!bothZero) {
    if (lowerWins) {
      // Only positive values compete under lowerWins; zero = "no data".
      const l = leftValue > 0 ? leftValue : Infinity;
      const r = rightValue > 0 ? rightValue : Infinity;
      leftWinning = l < r;
      rightWinning = r < l;
    } else {
      leftWinning = leftValue > rightValue;
      rightWinning = rightValue > leftValue;
    }
  }

  // Tug bar proportions.
  let leftFrac = 0.5;
  if (!bothZero) {
    if (lowerWins) {
      // Invert magnitudes so the smaller value shows the longer bar.
      const l = leftValue > 0 ? 1 / leftValue : 0;
      const r = rightValue > 0 ? 1 / rightValue : 0;
      const t = l + r;
      leftFrac = t > 0 ? l / t : 0.5;
    } else {
      const t = leftValue + rightValue;
      leftFrac = t > 0 ? leftValue / t : 0.5;
    }
  }
  const rightFrac = 1 - leftFrac;

  const leftBg = bothZero
    ? BOTH_ZERO
    : leftWinning
    ? `linear-gradient(90deg, ${AMBER_GRAD_START} 0%, ${AMBER_GRAD_END} 100%)`
    : LOSING;
  const rightBg = bothZero
    ? BOTH_ZERO
    : rightWinning
    ? `linear-gradient(270deg, ${AMBER_GRAD_START} 0%, ${AMBER_GRAD_END} 100%)`
    : LOSING;

  const leftColor = bothZero ? INK : leftWinning ? AMBER_WIN_VALUE : INK;
  const rightColor = bothZero ? INK : rightWinning ? AMBER_WIN_VALUE : INK;

  const hasLeft = leftValue > 0 || (!lowerWins && leftValue !== 0);
  const hasRight = rightValue > 0 || (!lowerWins && rightValue !== 0);

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
            fontSize: 10,
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
            minWidth: bothZero ? 0 : hasLeft ? 4 : 0,
          }}
        />
        <div
          aria-hidden
          style={{
            width: `calc(${rightFrac * 100}% - 1px)`,
            height: 4,
            borderRadius: 2,
            background: rightBg,
            minWidth: bothZero ? 0 : hasRight ? 4 : 0,
          }}
        />
      </div>
    </div>
  );
}

export const TugStat = memo(TugStatInner);
export default TugStat;
