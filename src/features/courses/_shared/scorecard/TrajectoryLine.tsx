import React from 'react';
import {
  SC_FILL_GOLD,
  SC_FILL_BIRDIE,
  SC_FILL_BOGEY,
  SC_FILL_DOUBLE,
} from '@/features/courses/components/holes/_constants';

const GEIST = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const INK = '#0F172A';
const MUTED = '#94A3B8';
const BASELINE = 'rgba(15,23,42,0.12)';
const UNDER_FILL = 'rgba(210,34,45,0.05)';

export interface TrajectoryHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

interface Props {
  holes: TrajectoryHole[];
  height?: number;
}

type Bead = { x: number; y: number; kind: 'eagle' | 'birdie' | 'bogey' | 'double' };

/**
 * Cumulative vs-par line across the round. Light-only. Skips holes
 * without both par and strokes; renders nothing when fewer than 2
 * plottable holes. Under par plots DOWN (improvement descends) --
 * matches the house sparkline convention.
 *
 * Every non-par hole gets a bead: eagle-or-better = gold disc,
 * birdie = red disc, bogey = blue square, double+ = navy square.
 */
export const TrajectoryLine: React.FC<Props> = ({ holes, height = 88 }) => {
  const w = 358;
  const padX = 6;
  const plottable = holes.filter(
    (h) => h.par != null && h.strokes != null && (h.strokes as number) > 0,
  );
  if (plottable.length < 2) return null;

  let cum = 0;
  const pts = plottable.map((h) => {
    const d = (h.strokes as number) - (h.par as number);
    cum += d;
    let kind: Bead['kind'] | null = null;
    if (d <= -2) kind = 'eagle';
    else if (d === -1) kind = 'birdie';
    else if (d === 1) kind = 'bogey';
    else if (d >= 2) kind = 'double';
    return { cum, kind };
  });

  const maxAbs = Math.max(...pts.map((p) => Math.abs(p.cum)), 1);
  const n = plottable.length;
  const x = (i: number) => padX + (n === 1 ? 0 : (i / (n - 1)) * (w - padX * 2));
  const y0 = height / 2;
  const y = (c: number) => y0 - (c / maxAbs) * (height / 2 - 12);

  const linePts = pts.map((p, idx) => `${x(idx).toFixed(1)},${y(p.cum).toFixed(1)}`);
  const path = linePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p}`).join(' ');

  // Under-par area fill: clip the polygon to the region below the E baseline
  // (i.e. y > y0). Build a closed polygon under the line, and rely on the
  // clipPath rect to render only the below-baseline slice.
  const areaPath = `${path} L ${x(n - 1).toFixed(1)} ${y0} L ${x(0).toFixed(1)} ${y0} Z`;

  const nineIdx = plottable.findIndex((h) => h.holeNo > 9);
  const clipId = React.useId();

  const beadFor = (kind: Bead['kind']) => {
    switch (kind) {
      case 'eagle':  return SC_FILL_GOLD;
      case 'birdie': return SC_FILL_BIRDIE;
      case 'bogey':  return SC_FILL_BOGEY;
      case 'double': return SC_FILL_DOUBLE;
    }
  };

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={y0} width={w} height={height - y0} />
        </clipPath>
      </defs>

      {/* dashed E baseline */}
      <line x1={padX} x2={w - padX} y1={y0} y2={y0}
        stroke={BASELINE} strokeWidth="1" strokeDasharray="3 4" />
      <text x={w - padX} y={y0 - 3} fill={MUTED} fontSize="8.5"
        fontWeight="700" textAnchor="end" fontFamily={GEIST}>E</text>

      {/* under-par area fill */}
      <path d={areaPath} fill={UNDER_FILL} clipPath={`url(#${clipId})`} />

      {/* nine divider */}
      {nineIdx > 0 && (
        <line x1={x(nineIdx - 0.5)} x2={x(nineIdx - 0.5)} y1={6} y2={height - 6}
          stroke={BASELINE} strokeWidth="1" />
      )}

      {/* line */}
      <path d={path} fill="none" stroke={INK} strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* beads on every non-par hole */}
      {pts.map((p, i) => {
        if (!p.kind) return null;
        const cx = x(i);
        const cy = y(p.cum);
        const fill = beadFor(p.kind);
        if (p.kind === 'eagle' || p.kind === 'birdie') {
          return <circle key={i} cx={cx} cy={cy} r="3.4" fill={fill} />;
        }
        return (
          <rect key={i} x={cx - 3.2} y={cy - 3.2} width="6.4" height="6.4"
            rx="1.4" fill={fill} />
        );
      })}
    </svg>
  );
};

export default TrajectoryLine;
