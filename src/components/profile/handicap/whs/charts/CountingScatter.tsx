/**
 * CountingScatter - which of the last 20 differentials count toward the index.
 *
 * POSITION IS THE POINT. "Which eight" is only answerable from position, so
 * this must never become a bar chart or a figure row.
 *
 * Renders NOTHING when the rounds array is empty.
 */
import React from 'react';
import { CHART, CHART_FONT, LABEL_STYLE } from './tokens';

export type CountingState = 'counts' | 'falling' | 'none';

export interface CountingRound {
  diff: number;
  state: CountingState;
}

interface Props {
  rounds: CountingRound[];
  height?: number;
  /**
   * ADDITIVE. Defaults keep every existing call site byte-identical: the
   * legend renders, no point is selectable and no point is ringed.
   */
  showLegend?: boolean;
  selectedIndex?: number | null;
  onSelectIndex?: (index: number) => void;
  /**
   * ADDITIVE, default null = no line and every existing call site unchanged.
   * A differential value to rule across the plot: the worst differential that
   * still counts. Everything on or below it is a counter, which is the thing
   * the section's sentence names ("the 8 below the line").
   */
  cutLine?: number | null;
}

const VIEW_W = 320;

/* DOT GEOMETRY AND THE INSET DERIVED FROM IT (SNAGS_01 §C, §D).
 *
 * The counting dot is reduced a touch (5.5 -> 4.75) while the non-counting dot
 * holds at 3, so the size difference that carries the meaning survives.
 *
 * THE SELECTION RING IS NEVER CLIPPED: the plot area is inset on all four
 * sides by (ring radius + half its stroke + a hair), DERIVED from these
 * constants, so the inset stays correct if the radius moves again. The tap
 * target is NOT tied to the radius — selection is resolved from the pointer's
 * horizontal fraction across the whole plot (see onPointerDown), so the hit
 * area is the full height of the svg regardless of how big a dot is drawn. */
/** Counting / falling-off dot. */
const DOT_R = 4.75;
/** Non-counting dot — deliberately much smaller. */
const DOT_R_NONE = 3;
/** Air between the selected dot and its ring. */
const RING_GAP = 3.5;
const RING_SW = 1;
const RING_R = DOT_R + RING_GAP;
/** Plot inset: the ring's full extent plus a hair of tolerance. */
const INSET = Math.ceil(RING_R + RING_SW / 2 + 0.5);

const PAD_X = INSET;
const PAD_Y = Math.max(10, INSET);

function fillFor(state: CountingState): string {
  if (state === 'counts') return CHART.DOWN;
  if (state === 'falling') return CHART.AMBER;
  return CHART.FAINT;
}

export const CountingScatter: React.FC<Props> = ({
  rounds,
  height = 104,
  showLegend = true,
  selectedIndex = null,
  onSelectIndex,
  cutLine = null,
}) => {
  if (!rounds || rounds.length === 0) return null;

  const values = rounds.map((r) => r.diff);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const innerW = VIEW_W - PAD_X * 2;
  const innerH = height - PAD_Y * 2;

  const x = (i: number) =>
    rounds.length === 1 ? VIEW_W / 2 : PAD_X + (i / (rounds.length - 1)) * innerW;
  const y = (v: number) => PAD_Y + (1 - (v - min) / span) * innerH;

  const path = rounds
    .map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(r.diff).toFixed(2)}`)
    .join(' ');

  return (
    <div style={{ fontFamily: CHART_FONT }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        style={{
          display: 'block',
          width: '100%',
          height,
          touchAction: onSelectIndex ? 'pan-y' : undefined,
        }}
        aria-hidden
        onPointerDown={
          onSelectIndex
            ? (e) => {
                // The viewBox is stretched (preserveAspectRatio none), so the
                // nearest index is resolved from the horizontal fraction, not
                // from circle geometry.
                const rect = e.currentTarget.getBoundingClientRect();
                if (rect.width === 0) return;
                const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                onSelectIndex(Math.round(frac * (rounds.length - 1)));
              }
            : undefined
        }
      >
        {cutLine != null && cutLine >= min && cutLine <= max && (
          /* THE LINE THE SENTENCE NAMES. Drawn under the trace so a point
             never disappears behind it. */
          <line
            x1={0}
            x2={VIEW_W}
            y1={y(cutLine)}
            y2={y(cutLine)}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {rounds.map((r, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(r.diff)}
            r={r.state === 'none' ? 3 : 5.5}
            fill={fillFor(r.state)}
          />
        ))}
        {selectedIndex != null && rounds[selectedIndex] && (
          <circle
            cx={x(selectedIndex)}
            cy={y(rounds[selectedIndex].diff)}
            r={9}
            fill="none"
            stroke={fillFor(rounds[selectedIndex].state)}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          ...LABEL_STYLE,
        }}
      >
        <span>Oldest</span>
        <span>Newest</span>
      </div>

      {showLegend && (
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid ${CHART.BORDER}`,
            ...LABEL_STYLE,
          }}
        >
          <LegendDot color={CHART.DOWN} text="Counts" />
          <LegendDot color={CHART.AMBER} text="Falling off" />
        </div>
      )}
    </div>
  );
};

const LegendDot: React.FC<{ color: string; text: string }> = ({ color, text }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span
      aria-hidden
      style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'block' }}
    />
    {text}
  </span>
);

export default CountingScatter;
