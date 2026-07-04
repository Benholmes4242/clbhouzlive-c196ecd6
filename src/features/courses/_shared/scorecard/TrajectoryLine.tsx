import React from 'react';
import {
  SC_BIRDIE, SC_DOUBLE, SC_BIRDIE_DARK, SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';
import type { ScorecardTheme } from './scorecardTheme';

const GEIST = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export interface TrajectoryHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

interface Props {
  holes: TrajectoryHole[];
  surface: 'light' | 'dark';
  theme: ScorecardTheme;
  height?: number;
}

/**
 * Cumulative vs-par line across the round. Skips holes without both
 * par and strokes; renders nothing (null) when fewer than 2 plottable
 * holes. Birdie-or-better holes bead as circles, double-or-worse as
 * squares, in the SC scoring tokens for the surface.
 */
export const TrajectoryLine: React.FC<Props> = ({
  holes, surface, theme, height = 88,
}) => {
  const w = 358;
  const padX = 6;
  const plottable = holes.filter((h) => h.par != null && h.strokes != null);
  if (plottable.length < 2) return null;

  let cum = 0;
  const pts = plottable.map((h, i) => {
    cum += (h.strokes as number) - (h.par as number);
    const d = (h.strokes as number) - (h.par as number);
    return { i, cum, birdie: d < 0, damage: d >= 2 };
  });
  const maxAbs = Math.max(...pts.map((p) => Math.abs(p.cum)), 1);
  const n = plottable.length;
  const x = (i: number) => padX + (n === 1 ? 0 : (i / (n - 1)) * (w - padX * 2));
  // par baseline sits mid-band; the line tracks the score as a number:
  // under par plots DOWN (score falling), over par plots UP -- consistent
  // with the Pulse and 90-day sparklines where improvement descends.
  const y0 = height / 2;
  const y = (c: number) => y0 - (c / maxAbs) * (height / 2 - 12);

  const path = pts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.i).toFixed(1)} ${y(p.cum).toFixed(1)}`)
    .join(' ');

  const final = pts[pts.length - 1].cum;
  const lineColor = final < 0 ? theme.under : final > 0 ? theme.over : theme.dim;
  const birdieTok = surface === 'dark' ? SC_BIRDIE_DARK : SC_BIRDIE;
  const damageTok = surface === 'dark' ? SC_DOUBLE_DARK : SC_DOUBLE;
  const finalLabel = final === 0 ? 'E' : final > 0 ? `+${final}` : `\u2212${Math.abs(final)}`;
  const nineIdx = plottable.findIndex((h) => h.holeNo > 9);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }} aria-hidden>
      <line x1={padX} x2={w - padX} y1={y0} y2={y0}
        stroke={theme.ghost} strokeWidth="1" strokeDasharray="3 4" />
      <text x={padX} y={y0 - 4} fill={theme.faint} fontSize="7.5"
        fontWeight="800" letterSpacing="0.1em" fontFamily={GEIST}>PAR</text>
      {nineIdx > 0 && (
        <line x1={x(nineIdx - 0.5)} x2={x(nineIdx - 0.5)} y1={6} y2={height - 6}
          stroke={theme.line} strokeWidth="1" />
      )}
      <path d={path} fill="none" stroke={lineColor} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p) =>
        p.birdie ? (
          <circle key={p.i} cx={x(p.i)} cy={y(p.cum)} r="3.4"
            fill={theme.bg} stroke={birdieTok} strokeWidth="1.8" />
        ) : p.damage ? (
          <rect key={p.i} x={x(p.i) - 2.8} y={y(p.cum) - 2.8} width="5.6"
            height="5.6" rx="1.4" fill={theme.bg} stroke={damageTok} strokeWidth="1.6" />
        ) : null,
      )}
      <text x={w - padX} y={y(final) + (final >= 0 ? -7 : 14)} fill={lineColor}
        fontSize="11" fontWeight="800" textAnchor="end" fontFamily={GEIST}>
        {finalLabel}
      </text>
    </svg>
  );
};

export default TrajectoryLine;
