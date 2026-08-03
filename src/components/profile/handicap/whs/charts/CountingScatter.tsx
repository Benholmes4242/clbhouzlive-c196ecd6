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
}

const VIEW_W = 320;
const PAD_X = 8;
const PAD_Y = 10;

function fillFor(state: CountingState): string {
  if (state === 'counts') return CHART.DOWN;
  if (state === 'falling') return CHART.AMBER;
  return CHART.FAINT;
}

export const CountingScatter: React.FC<Props> = ({ rounds, height = 104 }) => {
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
        style={{ display: 'block', width: '100%', height }}
        aria-hidden
      >
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
