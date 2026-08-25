/**
 * Head-to-head stat rows for the College compare page.
 *
 * TWO components, one shared outcome function:
 *   CountStatRow    - counts and sums (earnings, alumni, wins, top 10s).
 *                     A tug bar is honest here: 3 wins vs 1 fills 3/4.
 *   AverageStatRow  - means (scoring avg, driving distance, SG: total).
 *                     NO bar: there is nothing to take a proportion of when
 *                     the quantity is a mean, and a 49.98/50.02 split implies
 *                     "level" on a gap that matters. Coverage is shown instead.
 *
 * AMBER MEANS THE WINNER OF THE ROW, and that is CORRECT here. This surface has
 * no viewing member and no live round, so amber is free and its meaning is
 * bounded and local: "the better of the two". Do NOT "correct" it to ink.
 * Gold stays reserved for the aces / albatross register app-wide.
 *
 * TIES ARE DECIDED ON THE DISPLAYED VALUE. The formatter is the definition of
 * what the reader sees; if both sides format identically the row is Tied and
 * neither side is amber. No epsilon float comparison.
 *
 * MISSING is null/undefined, NOT <= 0. SG: Total is legitimately negative, and
 * 0 wins is a fact, not a gap. You cannot beat an absent opponent.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AMBER,
  BAR_NEUTRAL,
  FONT,
  INK,
  INK_FAINT,
} from '@/features/tourhub/_shared/tokens';
import type { CollegeAggregate } from './data/useCollegeAggregateStats';

const AMBER_WIN_VALUE = AMBER;

export interface RowOutcome {
  leftWinning: boolean;
  rightWinning: boolean;
  tied: boolean;
  /** true when at least one side is missing -> no winner, no caption */
  incomplete: boolean;
}

/** Single source of truth for who wins a head-to-head row. */
export function resolveOutcome(
  leftValue: number | null,
  rightValue: number | null,
  format: (n: number) => string,
  lowerWins = false,
): RowOutcome {
  const base = { leftWinning: false, rightWinning: false, tied: false, incomplete: false };
  if (leftValue == null || rightValue == null) return { ...base, incomplete: true };

  if (format(leftValue) === format(rightValue)) return { ...base, tied: true };

  if (lowerWins) {
    return { ...base, leftWinning: leftValue < rightValue, rightWinning: rightValue < leftValue };
  }
  return { ...base, leftWinning: leftValue > rightValue, rightWinning: rightValue > leftValue };
}

function stripSign(s: string): string {
  return s.replace(/^\+/, '').replace(/^-/, '');
}

function valueStyle(color: string, align: 'left' | 'right') {
  return {
    fontSize: 16,
    fontWeight: 700,
    color,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums lining-nums' as const,
    textAlign: align,
  };
}

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  color: INK_FAINT,
  letterSpacing: '0.06em', // tightened from 0.16em: READ 11 labels must stay on one line at 320 (DRIVING DISTANCE = 114.9px)
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  whiteSpace: 'nowrap' as const,
};

function useMarginCaption(
  outcome: RowOutcome,
  leftValue: number | null,
  rightValue: number | null,
  format: (n: number) => string,
  leftName: string,
  rightName: string,
): string | null {
  const { t } = useTranslation('tourhub');
  if (outcome.incomplete) return null;
  if (outcome.tied) return t('college.compare.tied');
  if (leftValue == null || rightValue == null) return null;
  // For plain numeric formats (70.80) the margin is taken from the DISPLAYED
  // values so the caption can never disagree with the two numbers above it.
  // Formats that scale or add units ($24.6M, 309.6 yds) keep the raw diff.
  const PLAIN = /^[+-]?\d+(\.\d+)?$/;
  const plain = PLAIN.test(format(leftValue).trim()) && PLAIN.test(format(rightValue).trim());
  const val = (n: number) => (plain ? Number.parseFloat(format(n)) : n);
  const margin = stripSign(format(Math.abs(val(leftValue) - val(rightValue))));


  const name = outcome.leftWinning ? leftName : rightName;
  if (!name) return null;
  return t('college.compare.marginBy', { name, margin });
}

interface SharedProps {
  label: string;
  leftValue: number | null;
  rightValue: number | null;
  format: (n: number) => string;
  lowerWins?: boolean;
  leftName: string;
  rightName: string;
}

// ---------------------------------------------------------------------------
// CountStatRow - tug bar retained.
// ---------------------------------------------------------------------------

function CountStatRowInner({
  label,
  leftValue,
  rightValue,
  format,
  lowerWins = false,
  leftName,
  rightName,
}: SharedProps) {
  const outcome = resolveOutcome(leftValue, rightValue, format, lowerWins);
  const caption = useMarginCaption(outcome, leftValue, rightValue, format, leftName, rightName);

  const l = leftValue ?? 0;
  const r = rightValue ?? 0;
  let leftFrac = 0.5;
  if (!outcome.incomplete) {
    if (lowerWins) {
      const li = l !== 0 ? 1 / Math.abs(l) : 0;
      const ri = r !== 0 ? 1 / Math.abs(r) : 0;
      const t = li + ri;
      leftFrac = t > 0 ? li / t : 0.5;
    } else {
      const t = Math.abs(l) + Math.abs(r);
      leftFrac = t > 0 ? Math.abs(l) / t : 0.5;
    }
  }
  const rightFrac = 1 - leftFrac;

  return (
    <div style={{ padding: '14px 16px', fontFamily: FONT }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div style={valueStyle(outcome.leftWinning ? AMBER_WIN_VALUE : INK, 'left')}>
          {leftValue == null ? '' : format(leftValue)}
        </div>
        <div style={LABEL_STYLE}>{label}</div>
        <div style={valueStyle(outcome.rightWinning ? AMBER_WIN_VALUE : INK, 'right')}>
          {rightValue == null ? '' : format(rightValue)}
        </div>
      </div>

      {/* Tug bar - flat fills, no gradients. */}
      <div style={{ display: 'flex', alignItems: 'center', height: 4, gap: 2 }}>
        <div
          aria-hidden
          style={{
            width: `calc(${leftFrac * 100}% - 1px)`,
            height: 4,
            borderRadius: 2,
            background: outcome.leftWinning ? AMBER : BAR_NEUTRAL,
            minWidth: leftValue == null ? 0 : 4,
          }}
        />
        <div
          aria-hidden
          style={{
            width: `calc(${rightFrac * 100}% - 1px)`,
            height: 4,
            borderRadius: 2,
            background: outcome.rightWinning ? AMBER : BAR_NEUTRAL,
            minWidth: rightValue == null ? 0 : 4,
          }}
        />
      </div>

      {caption && (
        <div style={{ ...LABEL_STYLE, marginTop: 8, whiteSpace: 'normal' }}>{caption}</div>
      )}
    </div>
  );
}

export const CountStatRow = memo(CountStatRowInner);

// ---------------------------------------------------------------------------
// AverageStatRow - no bar, coverage instead.
// ---------------------------------------------------------------------------

interface AverageProps {
  label: string;
  left: CollegeAggregate | null;
  right: CollegeAggregate | null;
  format: (n: number) => string;
  lowerWins?: boolean;
  leftName: string;
  rightName: string;
}

function Coverage({
  aggregate,
  align,
}: {
  aggregate: CollegeAggregate | null;
  align: 'left' | 'right';
}) {
  const { t } = useTranslation('tourhub');
  if (!aggregate?.coverage) return null;
  return (
    <div
      style={{
        marginTop: 3,
        // AXIS 10: coverage is a count pair (FROM 6 OF 14), a coordinate under the figure.
        fontSize: 10,
        fontWeight: 700,
        color: INK_FAINT,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums lining-nums',
        textAlign: align,
      }}
    >
      {t('college.compare.coverage', {
        with: aggregate.coverage.with,
        total: aggregate.coverage.total,
      })}
    </div>
  );
}

function AverageStatRowInner({
  label,
  left,
  right,
  format,
  lowerWins = false,
  leftName,
  rightName,
}: AverageProps) {
  const leftValue = left ? left.value : null;
  const rightValue = right ? right.value : null;
  const outcome = resolveOutcome(leftValue, rightValue, format, lowerWins);
  const caption = useMarginCaption(outcome, leftValue, rightValue, format, leftName, rightName);

  return (
    <div style={{ padding: '14px 16px', fontFamily: FONT }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div>
          <div style={valueStyle(outcome.leftWinning ? AMBER_WIN_VALUE : INK, 'left')}>
            {leftValue == null ? '' : format(leftValue)}
          </div>
          <Coverage aggregate={left} align="left" />
        </div>
        <div style={{ ...LABEL_STYLE, paddingTop: 5 }}>{label}</div>
        <div>
          <div style={valueStyle(outcome.rightWinning ? AMBER_WIN_VALUE : INK, 'right')}>
            {rightValue == null ? '' : format(rightValue)}
          </div>
          <Coverage aggregate={right} align="right" />
        </div>
      </div>

      {caption && (
        <div style={{ ...LABEL_STYLE, marginTop: 8, whiteSpace: 'normal' }}>{caption}</div>
      )}
    </div>
  );
}

export const AverageStatRow = memo(AverageStatRowInner);
