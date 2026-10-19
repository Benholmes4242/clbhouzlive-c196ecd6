/**
 * roundTilePlot — THE HOME FEED ROUND PLOT (BRIEF_ROUND_TILE_1).
 *
 * The Home feed tile draws the round's cumulative to-par trace ON THE CARD
 * CANVAS, full tile width, under the text block — never over the course
 * photograph (BEA4: a white line over fairway and green reads as a route;
 * this is a chart and the terrain beneath has no relationship to its shape).
 *
 * BEA5 — EVERY PLAYED HOLE GETS A DOT, in the house scorecard ramp and no
 * other: eagle-or-better SC_FILL_GOLD, birdie TOPAR_UNDER_DARK, par the dark
 * surface's muted even tone, bogey SC_BOGEY_DARK, double-or-worse
 * SC_DOUBLE_DARK. Under par is RED; it is never "corrected" to green.
 *
 * BEA6 — NO SCORING KEY. Five swatches on every round down a feed is five
 * swatches twenty times.
 *
 * BEA7/BEA8 — THE ONE NAMED MARK. Only an ace, an albatross or an eagle is
 * ever named, and only when the card has one: a single small gold swatch and
 * the word beside the plot. The name comes from scorecardFeatFor, which tests
 * strokes === 1 (ace) BEFORE par - 3 (albatross), so a par-four hole-in-one is
 * named an ace — beadForScore cannot make that distinction (both are d <= -2)
 * and is therefore never asked to.
 *
 * Data is the page-level useRoundHoleShapes batch (BEA2/BEA3): actual_gross,
 * played holes only, MIN_PLAYED_HOLES fallback — all enforced inside the hook.
 * This file draws nothing and fetches nothing beyond what it is handed.
 */
import { useId } from 'react';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { smoothPath } from '@/lib/charts/smoothPath';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import {
  SC_FILL_GOLD,
  SC_BOGEY_DARK,
  SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK, TOPAR_EVEN_DARK } from '@/features/tourhub/_shared/tokens';
import { scorecardFeatFor, type ScorecardFeatKind } from '@/features/courses/_shared/scorecard/scorecardFeat';

const PAD_X = 6;

export interface FeedDot {
  /** Index into HoleShape.series (cumulative value AFTER the hole). */
  i: number;
  tone: string;
  r: number;
}

/** BEA5 — one dot per played hole, graded in the scorecard ramp. */
export function feedHoleDots(shape: HoleShape | null | undefined): FeedDot[] {
  if (!shape) return [];
  const out: FeedDot[] = [];
  shape.holes.forEach((hole, index) => {
    if (hole.par == null || hole.strokes == null || hole.strokes <= 0) return;
    const d = hole.strokes - hole.par;
    const i = index + 1;
    if (d <= -2) out.push({ i, tone: SC_FILL_GOLD, r: 4 });
    else if (d === -1) out.push({ i, tone: TOPAR_UNDER_DARK, r: 2.8 });
    else if (d === 0) out.push({ i, tone: TOPAR_EVEN_DARK, r: 2.4 });
    else if (d === 1) out.push({ i, tone: SC_BOGEY_DARK, r: 2.8 });
    else out.push({ i, tone: SC_DOUBLE_DARK, r: 2.8 });
  });
  return out;
}

export interface FeedFeat {
  kind: Extract<ScorecardFeatKind, 'ace' | 'albatross' | 'eagle'>;
  word: string;
}

/** BEA7/BEA8 — the best thing on the card, named, or nothing at all. */
export function feedFeat(shape: HoleShape | null | undefined): FeedFeat | null {
  if (!shape) return null;
  const feat = scorecardFeatFor(shape.holes, shape.holes.length <= 9, 'member');
  if (!feat) return null;
  if (feat.kind === 'ace') return { kind: 'ace', word: 'Ace' };
  if (feat.kind === 'albatross') return { kind: 'albatross', word: 'Albatross' };
  if (feat.kind === 'eagle') return { kind: 'eagle', word: 'Eagle' };
  return null;
}

export function RoundTilePlot({
  shape,
  width = 340,
  height = 59,
}: {
  shape: HoleShape;
  width?: number;
  height?: number;
}) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const values = shape.series;
  if (!values || values.length < 2) return null;

  const lo = Math.min(0, ...values) - 0.7;
  const hi = Math.max(0, ...values) + 0.7;
  const span = Math.max(hi - lo, 2);
  const top = 8;
  const bottom = height - 8;
  const xFor = (i: number) => PAD_X + (i / Math.max(values.length - 1, 1)) * (width - PAD_X * 2);
  const yFor = (v: number) => bottom - ((v - lo) / span) * (bottom - top);
  const points = values.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const path = smoothPath(points);
  const baselineY = yFor(0);
  const dots = feedHoleDots(shape);
  const feat = feedFeat(shape);
  const last = points.at(-1);

  return (
    <div data-feed-round-plot="true" style={{ position: 'relative', marginTop: 10 }}>
      {feat ? (
        <span
          data-feed-round-feat="true"
          style={{
            position: 'absolute',
            top: -2,
            right: PAD_X,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Geist, sans-serif',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SC_FILL_GOLD,
          }}
        >
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: SC_FILL_GOLD }} />
          {feat.word}
        </span>
      ) : null}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden
        style={{ display: 'block' }}
      >
        <line
          x1={PAD_X}
          x2={width - PAD_X}
          y1={baselineY}
          y2={baselineY}
          stroke={A.HAIRLINE}
          strokeWidth={1}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke={A.INK}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {dots.map((dot) => {
          const p = points[dot.i];
          if (!p) return null;
          return (
            <circle
              key={`${instanceId}-${dot.i}`}
              cx={p.x}
              cy={p.y}
              r={dot.r}
              fill={dot.tone}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {last ? <circle cx={last.x} cy={last.y} r={2.6} fill={A.INK} /> : null}
      </svg>
    </div>
  );
}

export default RoundTilePlot;
