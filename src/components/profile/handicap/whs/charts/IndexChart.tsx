/**
 * IndexChart - line + area of a handicap index series over time.
 *
 * Colour is the DIRECTION OF TRAVEL, last point versus first:
 * rising -> UP (red, playing worse), falling -> DOWN (green), level -> MUTE.
 * That inversion is deliberate and is the opposite of the score convention.
 *
 * Renders NOTHING with fewer than 2 points. A chart is a claim about data.
 */
import React, { useId } from 'react';
import { CHART, CHART_FONT, LABEL_STYLE, indexTone, toneColor } from './tokens';

export interface IndexPoint {
  t: string;
  v: number;
}

interface Props {
  points: IndexPoint[];
  height?: number;
  /** Hide the "Lowest / Highest" footer row. */
  hideFooter?: boolean;
  /** Formatter for the first/last axis labels. Defaults to the raw string. */
  formatLabel?: (t: string) => string;
}

const VIEW_W = 320;
const PAD_X = 4;
const PAD_Y = 8;

export const IndexChart: React.FC<Props> = ({
  points,
  height = 96,
  hideFooter = false,
  formatLabel,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  if (!points || points.length < 2) return null;

  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const innerW = VIEW_W - PAD_X * 2;
  const innerH = height - PAD_Y * 2;

  const x = (i: number) => PAD_X + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD_Y + (1 - (v - min) / span) * innerH;

  const tone = indexTone(values[0], values[values.length - 1]);
  const color = toneColor(tone);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(p.v).toFixed(2)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(2)},${height} L${x(0).toFixed(2)},${height} Z`;

  const lowestIdx = values.indexOf(min);
  const lastIdx = points.length - 1;

  const gridYs = [0.25, 0.5, 0.75].map((f) => PAD_Y + f * innerH);

  const fmt = formatLabel ?? ((t: string) => t);

  return (
    <div style={{ fontFamily: CHART_FONT }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`ic-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {gridYs.map((gy, i) => (
          <line
            key={i}
            x1={0}
            x2={VIEW_W}
            y1={gy}
            y2={gy}
            stroke={CHART.GRID}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#ic-${uid})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        <circle cx={x(lowestIdx)} cy={y(min)} r={3.5} fill="none" stroke={CHART.DOWN} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <circle cx={x(lastIdx)} cy={y(values[lastIdx])} r={4.5} fill={color} />
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          ...LABEL_STYLE,
        }}
      >
        <span>{fmt(points[0].t)}</span>
        <span>{fmt(points[lastIdx].t)}</span>
      </div>

      {!hideFooter && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid ${CHART.BORDER}`,
            ...LABEL_STYLE,
          }}
        >
          <span style={{ color: CHART.DOWN }}>Lowest {min.toFixed(1)}</span>
          <span>Highest {max.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};

export default IndexChart;
