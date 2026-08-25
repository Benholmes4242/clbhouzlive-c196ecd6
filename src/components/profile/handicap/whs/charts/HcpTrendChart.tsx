import React, { useId, useMemo } from 'react';
import { smoothPathXY } from '@/lib/charts/smoothPath';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import type { IndexPoint } from './IndexChart';

interface Props {
  points: IndexPoint[];
  /** Index of the active revision. Defaults to the last point. */
  active?: number;
  /** Show a vertical crosshair at the active point. */
  showCrosshair?: boolean;
  /** Plot height in px. */
  height?: number;
  /** Plot width in px. Falls back to measuring the container when omitted. */
  width?: number;
  /** Horizontal padding. */
  padX?: number;
  /** Vertical padding. */
  padY?: number;
}

const AMBER = A.AMBER;

function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

function zoneColor(v: number, best: number, worst: number): string {
  const span = worst - best;
  const toBest = span <= 0 ? 1 : (worst - v) / span;
  if (toBest >= 0.66) return A.IMPROVED;
  if (toBest >= 0.33) return AMBER;
  return A.DRIFTED;
}

export const HcpTrendChart: React.FC<Props> = ({
  points,
  active: activeProp,
  showCrosshair = false,
  height = 96,
  width: widthProp,
  padX = 11,
  padY = 16,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const n = points.length;
  const active = Math.min(Math.max(activeProp ?? (n > 0 ? n - 1 : 0), 0), n - 1);

  const stats = useMemo(() => {
    if (n === 0) return null;
    const vals = points.map((p) => p.v);
    return { best: Math.min(...vals), worst: Math.max(...vals) };
  }, [points, n]);

  // If no explicit width is provided, the SVG fills the container and we
  // measure it via a 100% width wrapper.
  const [measuredWidth, setMeasuredWidth] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (widthProp != null) return;
    const el = ref.current;
    if (!el) return;
    const measure = () => setMeasuredWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [widthProp]);

  const width = widthProp ?? measuredWidth;

  const geom = useMemo(() => {
    if (!stats || n < 2 || width <= 0) return null;
    const span = stats.worst - stats.best || 1;
    const xy = points.map((p, i) => {
      const x = padX + (i / (n - 1)) * (width - 2 * padX);
      const y = padY + ((stats.worst - p.v) / span) * (height - padY * 2);
      return [x, y] as const;
    });
    const line = smoothPathXY(xy);
    const area = `${line} L${width - padX},${height} L${padX},${height} Z`;

    const net = points[n - 1].v - points[0].v;
    const deltaTone = Math.abs(net) < 0.05 ? A.DIM : net < 0 ? A.IMPROVED : A.DRIFTED;

    const flat = stats.worst - stats.best <= 0;
    const worstIdx = flat ? -1 : points.findIndex((p) => p.v === stats.worst);
    const bestIdx = flat ? -1 : points.findIndex((p) => p.v === stats.best);

    return { xy, line, area, deltaTone, worstIdx, bestIdx };
  }, [points, n, stats, width, height, padX, padY]);

  if (!geom || width <= 0) {
    return (
      <div
        ref={ref}
        style={{ width: '100%', height }}
      />
    );
  }

  const { xy, line, area, deltaTone, worstIdx, bestIdx } = geom;
  const [mx, my] = xy[active];
  const markerTone = zoneColor(points[active].v, stats.best, stats.worst);

  // Collision guard: nudge the low label away from the high one when extremes
  // are close in both x and y.
  let lowShift = 0;
  if (worstIdx >= 0 && bestIdx >= 0) {
    const dx = xy[bestIdx][0] - xy[worstIdx][0];
    const dy = Math.abs(xy[bestIdx][1] - xy[worstIdx][1]);
    if (Math.abs(dx) < 46 && dy < 16) {
      lowShift = dx >= 0 ? 24 : -24;
    }
  }

  const callout = (idx: number, kind: 'high' | 'low', xShift = 0) => {
    if (idx < 0) return null;
    const [cx, cy] = xy[idx];
    const tone = zoneColor(points[idx].v, stats.best, stats.worst);
    const onMarker = idx === active;
    const lx = Math.min(Math.max(cx + xShift, padX), width - padX);
    const nearLeft = lx <= padX + 18;
    const nearRight = lx >= width - padX - 18;
    const anchor = nearLeft ? 'start' : nearRight ? 'end' : 'middle';
    const tx = nearLeft ? 2 : nearRight ? width - 2 : lx;
    const ty = Math.max(cy - 8, 9);
    return (
      <g key={idx} opacity={onMarker ? 0.42 : 1}>
        {!onMarker && (
          <circle cx={cx} cy={cy} r={3.4} fill={tone} stroke="#FFFFFF" strokeWidth={1.6} />
        )}
        <text
          x={tx}
          y={ty}
          textAnchor={anchor}
          fill={tone}
          style={{ fontSize: 11, fontWeight: 700, ...FIGS }}
        >
          {formatIndex(points[idx].v)}
        </text>
      </g>
    );
  };

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`hcp-trend-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={deltaTone} stopOpacity={0.42} />
            <stop offset="100%" stopColor={deltaTone} stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id={`hcp-trend-stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            {points.map((p, i) => (
              <stop
                key={i}
                offset={`${(i / (n - 1)) * 100}%`}
                stopColor={zoneColor(p.v, stats.best, stats.worst)}
              />
            ))}
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#hcp-trend-fill-${uid})`} />
        <path
          d={line}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.6}
          strokeWidth={4.0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={line}
          fill="none"
          stroke={`url(#hcp-trend-stroke-${uid})`}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {callout(worstIdx, 'high')}
        {callout(bestIdx, 'low', lowShift)}
        {showCrosshair && (
          <line x1={mx} y1={0} x2={mx} y2={height} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={2} />
        )}
        <circle cx={mx} cy={my} r={8.5} fill="#FFFFFF" fillOpacity={0.45} />
        <circle cx={mx} cy={my} r={4.5} fill="#FFFFFF" />
        <circle cx={mx} cy={my} r={2.5} fill={markerTone} />
      </svg>
    </div>
  );
};

export default HcpTrendChart;
