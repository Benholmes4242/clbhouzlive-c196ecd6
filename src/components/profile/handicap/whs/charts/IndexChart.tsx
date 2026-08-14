/**
 * IndexChart - graded line + area of a handicap index series over time.
 *
 * THREE THINGS CARRY COLOUR AND THEY SAY DIFFERENT THINGS:
 *   1. THE STROKE grades by ZONE — one gradient stop per revision, coloured by
 *      where that revision sits between the member's BEST and WORST IN THE
 *      SERIES BEING DRAWN. Near best -> CHART.DOWN, mid -> CHART.AMBER,
 *      off best -> CHART.UP. The line is WHERE THEY HAVE BEEN.
 *   2. THE FILL takes the sign of the series' NET DELTA (last - first):
 *      rose (worse) -> CHART.UP, fell or level (improved) -> CHART.DOWN.
 *      The fill is WHERE THE WINDOW ENDED UP. Derived here, never passed in.
 *   3. THE CALLOUTS mark the high (off-best tone, above its point) and the low
 *      (near-best tone, below its point). Always those sides — a peak descends
 *      on both sides, so "below a peak" IS the curve.
 *
 * THE HALO UNDER THE STROKE IS THE CARD COLOUR, NEVER WHITE. A white halo over
 * a dark panel glows — the same fault TrajectoryLine's header records.
 *
 * THE AXIS: worse is HIGHER. SVG y grows downward, so the mapping SUBTRACTS.
 *
 * Renders NOTHING with fewer than 2 points. A chart is a claim about data.
 */
import React, { useId, useMemo } from 'react';
import { CHART, CHART_FONT, LABEL_STYLE } from './tokens';
import { monotonePath } from '@/lib/charts/monotonePath';

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
  /** The CARD colour behind the stroke. Never white on a dark panel. */
  halo?: string;
  /** Hide the off best / mid / near best legend. */
  hideLegend?: boolean;
}

const VIEW_W = 320;
const PAD_X = 4;
/** 16px of headroom at each end so neither callout clips. */
const PAD_Y = 16;
const FLAT_EPS = 0.001;

function zoneColor(v: number, best: number, worst: number): string {
  const span = worst - best;
  if (span <= FLAT_EPS) return CHART.MUTE;
  const toBest = (worst - v) / span; // 1 = at best
  if (toBest >= 0.66) return CHART.DOWN;
  if (toBest >= 0.33) return CHART.AMBER;
  return CHART.UP;
}

export const IndexChart: React.FC<Props> = ({
  points,
  height = 110,
  hideFooter = false,
  formatLabel,
  halo = CHART.PANEL,
  hideLegend = false,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const geom = useMemo(() => {
    if (!points || points.length < 2) return null;
    const values = points.map((p) => p.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const flat = max - min <= FLAT_EPS;

    const innerW = VIEW_W - PAD_X * 2;
    const innerH = height - PAD_Y * 2;

    const x = (i: number) => PAD_X + (i / (points.length - 1)) * innerW;
    // SUBTRACTS: a bigger index sits higher on the plot.
    const y = (v: number) => PAD_Y + (1 - (v - min) / span) * innerH;

    const pts = points.map((p, i) => ({ x: x(i), y: y(p.v) }));
    const line = monotonePath(pts);
    const area = `${line} L${pts[pts.length - 1].x.toFixed(2)},${height} L${pts[0].x.toFixed(2)},${height} Z`;

    // NET DELTA of the series being drawn — the fill's only input.
    const net = values[values.length - 1] - values[0];
    const fillColor = net > 0.05 ? CHART.UP : CHART.DOWN;

    return {
      values,
      min,
      max,
      flat,
      innerW,
      line,
      area,
      pts,
      net,
      fillColor,
      highIdx: values.indexOf(max),
      lowIdx: values.indexOf(min),
      lastIdx: points.length - 1,
      gridYs: [0.25, 0.5, 0.75].map((f) => PAD_Y + f * innerH),
    };
  }, [points, height]);

  if (!geom) return null;

  const {
    values, min, max, flat, line, area, pts, fillColor,
    highIdx, lowIdx, lastIdx, gridYs,
  } = geom;

  const fmt = formatLabel ?? ((t: string) => t);

  const callouts = flat
    ? []
    : ([
        { idx: highIdx, v: max, color: CHART.UP, above: true },
        { idx: lowIdx, v: min, color: CHART.DOWN, above: false },
      ] as const);

  return (
    <div style={{ fontFamily: CHART_FONT }}>
      <div style={{ position: 'relative', height }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${height}`}
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height }}
          aria-hidden
        >
          <defs>
            {/* Vertical wash — the WINDOW'S NET MOVE. */}
            <linearGradient id={`ica-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.22} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
            {/* Horizontal ramp — ONE STOP PER REVISION, coloured by zone. */}
            <linearGradient id={`icl-${uid}`} x1="0" y1="0" x2="1" y2="0">
              {values.map((v, i) => (
                <stop
                  key={i}
                  offset={`${((i / (values.length - 1)) * 100).toFixed(3)}%`}
                  stopColor={zoneColor(v, min, max)}
                />
              ))}
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

          <path d={area} fill={`url(#ica-${uid})`} />

          {/* Halo is the CARD colour. */}
          <path
            d={line}
            fill="none"
            stroke={halo}
            strokeWidth={6.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={line}
            fill="none"
            stroke={`url(#icl-${uid})`}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Extreme markers — omitted when the extreme IS the last revision. */}
          {callouts.map(
            (c) =>
              c.idx !== lastIdx && (
                <circle
                  key={`d${c.idx}-${c.above ? 'h' : 'l'}`}
                  cx={pts[c.idx].x}
                  cy={pts[c.idx].y}
                  r={3}
                  fill={halo}
                  stroke={c.color}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              ),
          )}

          <circle cx={pts[lastIdx].x} cy={pts[lastIdx].y} r={4.5} fill={fillColor} />
        </svg>

        {/* Labels live in HTML: the SVG is stretched, text must not be. */}
        {callouts.map((c) => {
          const fx = pts[c.idx].x / VIEW_W;
          const nearStart = fx < 0.0625;
          const nearEnd = fx > 0.9375;
          const style: React.CSSProperties = {
            position: 'absolute',
            top: pts[c.idx].y + (c.above ? -8 : 15),
            transform: c.above ? 'translateY(-100%)' : undefined,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: c.color,
            fontVariantNumeric: 'tabular-nums lining-nums',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          };
          if (nearStart) style.left = 2;
          else if (nearEnd) style.right = 2;
          else {
            style.left = `${fx * 100}%`;
            style.transform = c.above
              ? 'translate(-50%, -100%)'
              : 'translateX(-50%)';
          }
          return (
            <span key={`l${c.idx}-${c.above ? 'h' : 'l'}`} style={style}>
              {c.v.toFixed(1)}
            </span>
          );
        })}
      </div>

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

      {!hideLegend && (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {[
            { c: CHART.UP, l: 'Off best' },
            { c: CHART.AMBER, l: 'Mid' },
            { c: CHART.DOWN, l: 'Near best' },
          ].map((z) => (
            <span
              key={z.l}
              style={{ display: 'flex', alignItems: 'center', gap: 4, ...LABEL_STYLE }}
            >
              <span
                style={{
                  width: 10,
                  height: 2.5,
                  borderRadius: 2,
                  background: z.c,
                  display: 'block',
                }}
              />
              {z.l}
            </span>
          ))}
        </div>
      )}

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
