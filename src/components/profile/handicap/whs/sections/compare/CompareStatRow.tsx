/**
 * CompareStatRow - one paired stat.
 *
 * BRIEF_COMPARE_SHEET_DUEL, D1: the bar used to draw meShare = a / (a + b), a
 * SHARE OF THE SUM, which has nothing to do with how far apart the two figures
 * are. 78.3 v 70.7 - a 7.6-shot chasm - rendered 47/53, while 2 v 0 holes in
 * one rendered as a total wipeout. `meShare` is gone.
 *
 * THE BAR NOW DIVERGES FROM THE CENTRE AND ITS LENGTH IS THE MARGIN:
 *
 *   pct = min(100, (|me - them| / range) * 100)
 *
 * drawn half-width either side of a centre hairline, growing toward whoever
 * leads. A TIE DRAWS NO BAR.
 *
 * `range` IS SUPPLIED BY THE CALL SITE AND IS DERIVED FROM DATA - see
 * compareRanges.ts. It is never a constant chosen by feel. When no range is
 * given the row falls back to the larger of the two figures, i.e. the margin
 * read as a share of the bigger number, which is still derived from the pair in
 * front of the member rather than invented.
 *
 * D2: AMBER NO LONGER MARKS THE WINNER. Amber means the viewing member
 * everywhere else in the app, and colouring the leader made it mean a
 * different person row to row. The two columns are named ONCE at the top of
 * the panel - the member's side amber, the opponent's dim - and within a row
 * the LEADER is marked by WEIGHT AND INK (700/INK against 400/MUTE), never by
 * hue. The member's side of every bar is amber; the opponent's is white at 55%.
 *
 * POLARITY IS CARRIED BY `format`, never hardcoded per row. A NULL IS NOT A
 * SCORE: either side null means nobody leads and no bar is drawn, which is
 * also the both-zero and the tie case.
 */
import React from 'react';
import { CHART, CHART_FONT } from '../../charts';
import { formatValue, whoLeads, type H2HStatFormat } from './h2hStats';

interface Props {
  label: string;
  meValue: number | null;
  themValue: number | null;
  format: H2HStatFormat;
  decimals?: number;
  /** Derived margin at which the bar is full. See compareRanges.ts. */
  range?: number | null;
}

const OPPONENT_BAR = 'rgba(255,255,255,0.55)';

export const CompareStatRow: React.FC<Props> = ({
  label,
  meValue,
  themValue,
  format,
  decimals,
  range,
}) => {
  const { winner } = whoLeads(format, meValue, themValue);
  const leader = winner === 'tie' ? null : winner;

  const figure = (side: 'me' | 'them'): React.CSSProperties => ({
    fontFamily: CHART_FONT,
    fontSize: 16,
    fontWeight: leader === side ? 700 : leader ? 400 : 600,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums lining-nums',
    color: leader === side ? CHART.INK : CHART.MUTE,
    textAlign: side === 'me' ? 'left' : 'right',
  });

  // THE MARGIN, not the share. No leader means no bar at all.
  const hasBoth = meValue != null && themValue != null;
  const margin = hasBoth ? Math.abs(Number(meValue) - Number(themValue)) : 0;
  const denom =
    range != null && Number.isFinite(range) && range > 0
      ? range
      : Math.max(Math.abs(Number(meValue ?? 0)), Math.abs(Number(themValue ?? 0)));
  const pct =
    leader && hasBoth && denom > 0
      ? Math.min(100, Math.max(4, (margin / denom) * 100))
      : 0;

  return (
    <div style={{ padding: '11px 0', fontFamily: CHART_FONT }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '58px 1fr 58px',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={figure('me')}>{formatValue(meValue, format, decimals)}</span>
        <span
          style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: CHART.DIM,
          }}
        >
          {label}
        </span>
        <span style={figure('them')}>{formatValue(themValue, format, decimals)}</span>
      </div>

      {/* Diverging bar: half-width each side of a centre hairline. */}
      <div
        aria-hidden
        style={{
          marginTop: 7,
          display: 'flex',
          alignItems: 'center',
          height: 5,
        }}
      >
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {leader === 'me' && pct > 0 && (
            <div
              style={{
                width: `${pct}%`,
                height: 5,
                borderRadius: 999,
                background: CHART.AMBER,
              }}
            />
          )}
        </div>
        <div style={{ width: 1, height: 9, background: CHART.FAINT, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          {leader === 'them' && pct > 0 && (
            <div
              style={{
                width: `${pct}%`,
                height: 5,
                borderRadius: 999,
                background: OPPONENT_BAR,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareStatRow;
