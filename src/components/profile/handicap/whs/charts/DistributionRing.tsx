/**
 * DistributionRing - a segmented ring with a figure in the middle.
 *
 * THIS IS THE PERMITTED USE OF A RING. A ring around a single number is
 * decoration and is banned on this surface; a ring carrying real segments
 * that sum to a whole is a chart, because the arc lengths are the data.
 *
 * Renders NOTHING when there are no segments or every value is zero.
 */
import React from 'react';
import { CHART, CHART_FONT, LABEL_STYLE, toneColor, type ChartTone } from './tokens';

export interface RingSegment {
  /** Label */
  l: string;
  /** Value */
  v: number;
  /** Colour */
  c: string;
}

interface Props {
  segments: RingSegment[];
  centre: React.ReactNode;
  sub: string;
  delta?: { text: string; tone: ChartTone };
  size?: number;
  stroke?: number;
}

export const DistributionRing: React.FC<Props> = ({
  segments,
  centre,
  sub,
  delta,
  size = 148,
  stroke = 12,
}) => {
  if (!segments || segments.length === 0) return null;
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.v), 0);
  if (total <= 0) return null;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = Math.max(0, seg.v) / total;
    const len = frac * c;
    const arc = { seg, len, offset };
    offset += len;
    return arc;
  });

  const deltaColor = delta ? toneColor(delta.tone) : CHART.MUTE;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        fontFamily: CHART_FONT,
      }}
    >
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={CHART.TRACK} strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.seg.c}
            strokeWidth={stroke}
            strokeDasharray={`${a.len} ${c - a.len}`}
            strokeDashoffset={-a.offset}
          />
        ))}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <span
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: CHART.INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {centre}
        </span>
        <span style={LABEL_STYLE}>{sub}</span>
        {delta && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: deltaColor,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {delta.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default DistributionRing;
