// SALVAGED — claimed by Tour Overview rebuild reachable via ChampionStrip; kept for Phase 2/3. Do not sweep as unreachable.
/**
 * TrajectorySparkline — round-by-round cumulative to-par sparkline.
 * Pure SVG, no D3/Recharts. Per HERO_PASS_3_BRIEF §2.
 *
 * Plot decision (locked): y-axis is cumulative to-par. Lower-to-par = better =
 * higher on the chart (smaller SVG y). A downward slope = climbing the
 * leaderboard. Do not reverse.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { classifyTrajectory } from '../HybridHero.utils';
import { TREND_UP, TREND_DOWN } from '../../../_shared/tokens';
import { OVERVIEW } from '../overviewTokens';

interface TrajectorySparklineProps {
  /**
   * Per-round TO-PAR figures, straight from sr_leaderboards.round_N — never
   * stroke counts. e.g. [-8, -3, -2, 1] plots cumulative -8, -11, -13, -12.
   * 2+ entries required to render.
   */
  rounds: number[];
  /** Visual variant — affects size + stroke weight. 'bars' is the hero
   *  board's SHAPE column (BRIEF_TOUR_OVERVIEW_MOCK_EXACT §D.5): one bar per
   *  scheduled round, read from `slots` rather than `rounds`. */
  variant?: 'solo' | 'tied' | 'champion' | 'bars';
  /** 'bars' only: one to-par figure per scheduled round; null = not yet played. */
  slots?: Array<number | null>;
  /** 'bars' only: zero-based index of the round in progress, painted amber whatever its score. */
  liveIndex?: number | null;
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

/** Cumulative to-par after each round. Input is already to-par: no par term. */
export function trajectoryPoints(rounds: number[]): number[] {
  let cumulative = 0;
  return rounds.map((r) => (cumulative += r));
}

export function TrajectorySparkline({
  rounds,
  variant = 'solo',
  totalRounds,
  ariaHidden = false,
  slots,
  liveIndex = null,
}: TrajectorySparklineProps) {
  const { t } = useTranslation('tourhub');
  if (variant === 'bars') return <ShapeBars slots={slots ?? []} liveIndex={liveIndex} />;
  if (rounds.length < 2) return null;

  const { width, height, stroke, dotR } = SIZING[variant];
  const classification = classifyTrajectory(rounds);
  const colour = COLOURS[classification];

  const points = trajectoryPoints(rounds);

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

  // NEVER-KEY tokens: rounds values / totalRounds are score data; only the surrounding prose is translated.
  const roundsStr = rounds.join(', ');
  const ariaLabel = totalRounds && rounds.length < totalRounds
    ? t('overview.trajectorySparkline.ariaLabelRoundOf', {
        rounds: roundsStr,
        current: rounds.length,
        total: totalRounds,
      })
    : t('overview.trajectorySparkline.ariaLabel', { rounds: roundsStr });

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

/** Bar height for a played round: 4px floor, +1.5px per shot from par, 13px cap. */
export function shapeBarHeight(toPar: number): number {
  return Math.min(13, Math.max(4, 4 + Math.abs(toPar) * 1.5));
}

/**
 * Colour of one SHAPE bar. Under par takes the mock's red; level or over takes
 * the soft ink; the round in progress is amber regardless of its score. The
 * mock painted every bar red only because every sample round was under par.
 */
export function shapeBarColor(toPar: number | null, live: boolean): string {
  if (live) return OVERVIEW.shape.live;
  if (toPar == null) return OVERVIEW.shape.stub;
  return toPar < 0 ? OVERVIEW.shape.under : OVERVIEW.shape.level;
}

function ShapeBars({ slots, liveIndex }: { slots: Array<number | null>; liveIndex: number | null }) {
  return (
    <span aria-hidden data-shape-bars style={{ display: 'inline-flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 2, height: 13 }}>
      {slots.map((v, i) => {
        const live = i === liveIndex && v != null;
        return (
          <span
            key={i}
            data-shape-bar={v == null ? 'stub' : live ? 'live' : v < 0 ? 'under' : 'level'}
            style={{ width: 4, height: v == null ? 3 : shapeBarHeight(v), borderRadius: 1, background: shapeBarColor(v, live) }}
          />
        );
      })}
    </span>
  );
}
