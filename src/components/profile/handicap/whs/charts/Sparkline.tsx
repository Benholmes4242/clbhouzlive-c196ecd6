/**
 * Sparkline - stroke-only micro line. No fill.
 *
 * Tone is passed in by the caller so the handicap inversion stays with the
 * data owner: an index series that has RISEN must be passed tone 'up' (red).
 *
 * Renders NOTHING with fewer than 2 values.
 */
import React from 'react';
import { toneColor, type ChartTone } from './tokens';

interface Props {
  values: number[];
  tone: ChartTone;
  w?: number;
  h?: number;
}

export const Sparkline: React.FC<Props> = ({ values, tone, w = 64, h = 22 }) => {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;

  const d = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} style={{ display: 'block' }} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={toneColor(tone)}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
