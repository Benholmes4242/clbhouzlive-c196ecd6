/**
 * MiniRing - a single rate as an arc, used three-up.
 *
 * ALL INSTANCES IN A GROUP MUST BE PASSED THE SAME `max`. Three rings each
 * normalised to their own value render identically full and say nothing.
 * Use `sharedMax()` to derive one ceiling from the whole group.
 *
 * Renders NOTHING when value is null or max is not positive.
 */
import React from 'react';
import { CHART, CHART_FONT, LABEL_STYLE, toneColor, type ChartTone } from './tokens';

interface Props {
  value: number | null | undefined;
  /** Shared ceiling across the whole group. */
  max: number;
  label: string;
  sub: string;
  tone: ChartTone;
  size?: number;
  stroke?: number;
  /** Digits for the centre figure. */
  digits?: number;
}

/** One ceiling for a group of rings. Falls back to `floor` when data is flat. */
export function sharedMax(values: Array<number | null | undefined>, floor = 0.7): number {
  const clean = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (clean.length === 0) return floor;
  return Math.max(floor, ...clean.map((v) => Math.abs(v)));
}

export const MiniRing: React.FC<Props> = ({
  value,
  max,
  label,
  sub,
  tone,
  size = 84,
  stroke = 8,
  digits = 2,
}) => {
  if (value == null || Number.isNaN(value) || !(max > 0)) return null;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, Math.max(0, Math.abs(value) / max));
  const color = toneColor(tone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        fontFamily: CHART_FONT,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={CHART.TRACK} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${frac * c} ${c}`}
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: CHART.INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {value.toFixed(digits)}
        </span>
      </div>
      <span style={{ ...LABEL_STYLE, color: CHART.MUTE }}>{label}</span>
      <span style={LABEL_STYLE}>{sub}</span>
    </div>
  );
};

export default MiniRing;
