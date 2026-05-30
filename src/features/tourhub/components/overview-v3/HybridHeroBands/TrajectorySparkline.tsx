/**
 * TrajectorySparkline — round-by-round cumulative to-par sparkline.
 * Pure SVG, no D3/Recharts. Per HERO_PASS_3_BRIEF §2.
 *
 * Plot decision (locked): y-axis is cumulative to-par. Lower-to-par = better =
 * higher on the chart (smaller SVG y). A downward slope = climbing the
 * leaderboard. Do not reverse.
 */

import React from 'react';
import { classifyTrajectory } from '../HybridHero.utils';
import { TREND_UP, TREND_DOWN } from '../../../_shared/tokens';

interface TrajectorySparklineProps {
  /** Per-round scores, e.g. [66, 63, 65, 60]. 2+ entries required to render. */
  rounds: number[];
  /** Course par per round (typically 70–72). Used to compute cumulative to-par. */
  par: number;
  /** Visual variant — affects size + stroke weight. */
  variant?: 'solo' | 'tied' | 'champion';
  /** Number of total rounds expected (4 for standard, 3 for shortened). For aria-label only. */
  totalRounds?: number;
  /** Hide from a11y tree (used when parent row has the descriptive label). */
  ariaHidden?: boolean;
}

const COLOURS = {
  climbed: TREND_UP,        // green — ascending trajectory over rounds
  steady: 'rgba(15,23,42,0.5)',
  faded: TREND_DOWN,        // red — descending trajectory over rounds
} as const;

const SIZING = {
  solo: { width: 28, height: 10, stroke: 1.2, dotR: 1.4 },
  tied: { width: 28, height: 10, stroke: 1.2, dotR: 1.4 },
  champion: { width: 44, height: 14, stroke: 1.5, dotR: 1.8 },
} as const;

export function TrajectorySparkline({
  rounds,
  par,
  variant = 'solo',
  totalRounds,
  ariaHidden = false,
}: TrajectorySparklineProps) {
  if (rounds.length < 2 || !par || par <= 0) return null;

  const { width, height, stroke, dotR } = SIZING[variant];
  const classification = classifyTrajectory(rounds, par);
  const colour = COLOURS[classification];

  let cumStrokes = 0;
  const points = rounds.map((r, i) => {
    cumStrokes += r;
    return cumStrokes - par * (i + 1);
  });

  const minY = Math.min(...points);
  const maxY = Math.max(...points);
  const rangeY = Math.max(maxY - minY, 1);
  const padY = 1;
  const stepX = rounds.length > 1 ? width / (rounds.length - 1) : 0;

  // Lower (more negative) cumToPar = better = HIGHER on screen (smaller y).
  const yFor = (p: number) => padY + ((p - minY) / rangeY) * (height - 2 * padY);

  const polyPoints = points.map((p, i) => `${i * stepX},${yFor(p)}`).join(' ');
  const lastX = (rounds.length - 1) * stepX;
  const lastY = yFor(points[points.length - 1]);

  const ariaLabel = `Trajectory: rounds ${rounds.join(', ')}${
    totalRounds && rounds.length < totalRounds ? ` (round ${rounds.length} of ${totalRounds})` : ''
  }`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden || undefined}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <polyline
        points={polyPoints}
        stroke={colour}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={classification === 'steady' ? 0.5 : variant === 'tied' ? 0.75 : 1}
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={dotR}
        fill={colour}
        opacity={classification === 'steady' ? 0.65 : 1}
      />
    </svg>
  );
}
