/**
 * LastTwentyBars — BRIEF_LAST_20_BARS_AND_THE_EIGHT.
 *
 * Twenty capsule bars, OLDEST LEFT, NEWEST RIGHT; better (lower differential)
 * is taller, scaled across these rounds only with a BAR_FLOOR px floor. Below a
 * rule: the counting set in ascending order, a divider, then the next in line.
 *
 * TWO ORDERS, DELIBERATELY UNALIGNED: the bars are chronological, the strip is
 * sorted. The strip is laid out with its own flex distribution; nothing shares
 * an x position with a bar.
 */
import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { CHART, LABEL_STYLE } from './tokens';

export const BAR_FLOOR = 10;
const BAR_AREA = 72;
/* BRIEF_LAST_20_BAR_GEOMETRY: 356-unit row, GAP 4 units, BAR = (356 - 19*4)/20 = 14.
   Expressed as % of the row so the 77.8% fill holds at every width. */
export const VIEW_W = 356;
export const GAP_U = 4;
export const barUnits = (n: number) => (VIEW_W - Math.max(n - 1, 0) * GAP_U) / Math.max(n, 1);

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontSize: 14.5,
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

export interface BarRound {
  diff: number | null;
  counts: boolean;
}

interface Props {
  rounds: BarRound[];
  /** Counting set, already sorted ascending, already formatted. */
  eight: string[];
  /** Ninth-best; null when there is none (absent, not a dash). */
  next: string | null;
  nextLabel: string;
  selectedIndex: number | null;
  onSelectIndex: (i: number) => void;
}

const LastTwentyBars: React.FC<Props> = ({ rounds, eight, next, nextLabel, selectedIndex, onSelectIndex }) => {
  const diffs = rounds.map((r) => r.diff).filter((d): d is number => d != null);
  const lo = diffs.length ? Math.min(...diffs) : 0;
  const hi = diffs.length ? Math.max(...diffs) : 0;
  const heightOf = (d: number | null) => {
    if (d == null) return BAR_FLOOR;
    if (hi === lo) return BAR_AREA;
    return BAR_FLOOR + ((hi - d) / (hi - lo)) * (BAR_AREA - BAR_FLOOR);
  };

  return (
    <div>
      <div style={{ display: 'flex', columnGap: `${(GAP_U / VIEW_W) * 100}%`, alignItems: 'flex-end', height: BAR_AREA }}>
        {rounds.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectIndex(i)}
            aria-label={`Round ${i + 1} of ${rounds.length}`}
            aria-pressed={selectedIndex === i}
            style={{
              display: 'flex', alignItems: 'flex-end',
              flex: `0 0 ${(barUnits(rounds.length) / VIEW_W) * 100}%`,
              height: '100%', minWidth: 0, padding: 0, margin: 0,
              border: 'none', background: 'transparent', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                display: 'block', width: '100%', height: heightOf(r.diff), borderRadius: 9999,
                background: r.counts ? A.IMPROVED : CHART.BAR_IDLE,
                opacity: selectedIndex != null && selectedIndex !== i ? 0.55 : 1,
              }}
            />
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, ...LABEL_STYLE }}>
        <span>Oldest</span>
        <span>Newest</span>
      </div>

      {eight.length > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${A.SOFT}`,
          }}
        >
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', minWidth: 0 }}>
            {eight.map((v, i) => (
              <span key={i} style={{ ...FIG, color: A.IMPROVED }}>{v}</span>
            ))}
          </div>
          {next != null && (
            <>
              <span aria-hidden style={{ width: 1, height: 18, background: A.SOFT, flexShrink: 0 }} />
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, flexShrink: 0 }}>
                <span style={{ ...FIG, color: A.DIM }}>{next}</span>
                <span style={{ ...LABEL_STYLE, color: A.DIM }}>{nextLabel}</span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LastTwentyBars;
