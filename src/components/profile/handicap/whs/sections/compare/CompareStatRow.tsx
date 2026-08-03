/**
 * CompareStatRow - one paired stat.
 *
 * Grid 52px 1fr 52px: the member's figure, the label centred, their figure
 * right-aligned. Beneath it, a two-segment bar.
 *
 * AMBER ON THIS SHEET MEANS THE LEADER OF A ROW (and, in the heads row, the
 * viewing member's own side). There is no live round and no course difficulty
 * on this surface, so amber carries no other meaning here.
 *
 * POLARITY IS CARRIED BY `format`, never hardcoded per row. Gross, scoring
 * average and index are low_better; stableford, birdies, rounds are
 * high_better/count. A row where both sides are zero renders both figures INK
 * with no amber - nobody leads at zero aces.
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
}

export const CompareStatRow: React.FC<Props> = ({
  label,
  meValue,
  themValue,
  format,
  decimals,
}) => {
  const { winner } = whoLeads(format, meValue, themValue);

  const figure = (side: 'me' | 'them'): React.CSSProperties => ({
    fontFamily: CHART_FONT,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums lining-nums',
    color: winner === side ? CHART.AMBER : CHART.INK,
    textAlign: side === 'me' ? 'left' : 'right',
  });

  // Two-segment bar. For low_better the SMALLER figure earns the longer
  // segment, so the bar and the amber figure never disagree.
  const a = Math.abs(Number(meValue ?? 0));
  const b = Math.abs(Number(themValue ?? 0));
  const total = a + b;
  let meShare = 0.5;
  if (total > 0) {
    meShare = format === 'low_better' || format === 'delta_low_better'
      ? b / total
      : a / total;
  }
  const mePct = Math.round(meShare * 100);

  return (
    <div style={{ padding: '11px 0', fontFamily: CHART_FONT }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr 52px',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={figure('me')}>
          {formatValue(meValue, format, decimals)}
        </span>
        <span
          style={{
            textAlign: 'center',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: CHART.DIM,
          }}
        >
          {label}
        </span>
        <span style={figure('them')}>
          {formatValue(themValue, format, decimals)}
        </span>
      </div>

      <div
        aria-hidden
        style={{
          marginTop: 7,
          display: 'flex',
          height: 3,
          borderRadius: 2,
          overflow: 'hidden',
          gap: 2,
        }}
      >
        <div
          style={{
            width: `${mePct}%`,
            background: winner === 'me' ? CHART.AMBER : CHART.TRACK,
          }}
        />
        <div
          style={{
            flex: 1,
            background: winner === 'them' ? CHART.AMBER : CHART.TRACK,
          }}
        />
      </div>
    </div>
  );
};

export default CompareStatRow;
