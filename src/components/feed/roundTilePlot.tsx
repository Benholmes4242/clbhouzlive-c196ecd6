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
import { UnderParGradientFill } from '@/lib/charts/UnderParGradientFill';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import {
  SC_FILL_GOLD,
  SC_BOGEY_DARK,
  SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import type { AchievementCallout } from '@/features/explore-magazine/cardTreatment';
import type { ExploreRoundFeat } from '@/features/explore-magazine/roundFeatCollection';
import { scorecardFeatFor, type ScorecardFeatKind } from '@/features/courses/_shared/scorecard/scorecardFeat';

const PAD_X = 6;

// TOPAR_EVEN_DARK rgba(242,244,247,0.42) composited on Home's CARD
// (FEED_CARD_SURFACE #16161A), rounded per channel: #727377. Alpha cannot
// travel to a dot sitting on the trace: the line would show through the mark.
const PAR_DOT_INK = '#727377';

// ROUND_PLOT_1_R: a six-stroke floor keeps a flat round flat rather than
// magnifying two strokes into the same full-box amplitude as sixteen.
export const MIN_ROUND_PLOT_SPAN = 6;

export function roundPlotRange(values: readonly number[]) {
  const lowest = Math.min(0, ...values);
  const highest = Math.max(0, ...values);
  const padding = Math.max(0, MIN_ROUND_PLOT_SPAN - (highest - lowest)) / 2;
  return { lo: lowest - padding, hi: highest + padding };
}

/**
 * FN1 — STROKES RECEIVED PER PLAYED HOLE, aligned with shape.holes.
 *
 * Authority: the provider's whs_score_holes.strokes_allowed when every played
 * hole carries it and it is not uniformly zero (a scratch round computes to
 * all zeros anyway). Otherwise computed from gam_round_net.course_handicap
 * (general play: 100%, no allowance) and the stroke index:
 * floor(H/18) on every hole, one more on SI 1..H mod 18; a plus handicap
 * gives strokes back in reverse stroke-index order (SI 18 first).
 *
 * null = the round cannot be netted: no handicap, or a played hole without a
 * usable stroke index. NINE-HOLE CARDS are computed by NO convention until
 * ruled (FN1 Ruling 4) — they use the provider's allocation or return null.
 */
export function feedStrokesReceived(
  shape: HoleShape | null | undefined,
  courseHandicap: number | null | undefined,
): number[] | null {
  if (!shape || courseHandicap == null || !Number.isFinite(courseHandicap)) return null;
  const holes = shape.holes;
  if (holes.length === 0) return null;
  const provided = holes.map((h) => h.strokesAllowed);
  if (provided.every((v) => v != null && Number.isFinite(v)) && provided.some((v) => v !== 0)) {
    return provided as number[];
  }
  if (holes.length <= 9) return null;
  const sis = holes.map((h) => h.strokeIndex);
  if (!sis.every((si) => si != null && Number.isInteger(si) && si >= 1 && si <= 18)) return null;
  const H = Math.round(courseHandicap);
  const magnitude = Math.abs(H);
  const base = Math.floor(magnitude / 18);
  const extra = magnitude % 18;
  return (sis as number[]).map((si) => {
    const gets = base + (H >= 0 ? (si <= extra ? 1 : 0) : (si > 18 - extra ? 1 : 0));
    return H >= 0 ? gets : -gets;
  });
}

/** FN1.1 — cumulative NET to par, leading 0, from actual gross minus received. */
export function feedNetSeries(shape: HoleShape, received: readonly number[]): number[] {
  const out = [0];
  let cum = 0;
  shape.holes.forEach((h, i) => {
    if (h.par == null || h.strokes == null) { out.push(cum); return; }
    cum += h.strokes - h.par - (received[i] ?? 0);
    out.push(cum);
  });
  return out;
}

export interface FeedDot {
  /** Index into HoleShape.series (cumulative value AFTER the hole). */
  i: number;
  tone: string;
  r: number;
}

/** BEA5 — one dot per played hole, graded in the scorecard ramp. */
/** FGD1 — grade GROSS minus par; received remains accepted for existing callers
 *  but only the trace and fill use the allowance, never the dots. */
export function feedHoleDots(shape: HoleShape | null | undefined, received?: readonly number[] | null): FeedDot[] {
  if (!shape) return [];
  const out: FeedDot[] = [];
  shape.holes.forEach((hole, index) => {
    if (hole.par == null || hole.strokes == null || hole.strokes <= 0) return;
    const d = hole.strokes - hole.par;
    const i = index + 1;
    if (d <= -2) out.push({ i, tone: SC_FILL_GOLD, r: 2.8 });
    else if (d === -1) out.push({ i, tone: TOPAR_UNDER_DARK, r: 2.8 });
    else if (d === 0) out.push({ i, tone: PAR_DOT_INK, r: 2.4 });
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

/** BRIEF_ROUND_TILE_1_R2 BGA3/BGA4 -- one fact, one place. The panel shows a
 *  round feat; when the plot's gold mark already names a rare hole and the
 *  panel's headline is a rare-hole kind too, the panel is suppressed. */
export function panelShowsCallout(kind: string | null, shape: HoleShape | null | undefined): boolean {
  if (!kind) return false;
  const holeKind = kind === 'ace' || kind === 'albatross' || kind === 'eagle';
  if (!holeKind) return true;
  /* BRIEF_ROUND_TILE_1_R3 -- `undefined` means the hole batch has not settled.
     Hole feats wait (no placeholder, no reserved height); decide once settled. */
  if (shape === undefined) return false;
  return feedFeat(shape) == null;
}

/** BRIEF_ROUND_TILE_1_R5 -- EXCLUSION, not fall-through. The panel takes its
 *  top-ranked feats (up to two, as Explore does), excluding any feat the gold
 *  mark already names. Until the hole batch settles (shape === undefined) no
 *  hole feat is a candidate; birdie runs, clean cards and board feats never
 *  wait. Style follows the feat: only ace/albatross/eagle keep a gold tier. */
export function homePanelCallout(
  callout: AchievementCallout | null,
  shape: HoleShape | null | undefined,
  allFeats?: ExploreRoundFeat[],
): AchievementCallout | null {
  if (!callout) return null;
  if (callout.kind !== 'ace' && callout.kind !== 'albatross' && callout.kind !== 'eagle'
    && callout.kind !== 'birdies' && callout.kind !== 'clean') {
    return callout; // board feats: record, net_record, rank_up
  }
  const isHole = (k: string) => k === 'ace' || k === 'albatross' || k === 'eagle';
  const marked = shape === undefined ? null : feedFeat(shape)?.kind ?? null;
  const pool = allFeats ?? callout.feats;
  const kept = pool
    .filter((f) => !(shape === undefined && isHole(f.kind)))
    .filter((f) => f.kind !== marked)
    .slice(0, 2);
  const first = kept[0];
  if (!first) return null;
  if (first.kind === 'birdies') return { kind: 'birdies', count: first.count, feats: kept, tier: 'ink' };
  if (first.kind === 'clean') return { kind: 'clean', feats: kept, tier: 'ink' };
  const hole = 'hole' in callout && callout.kind === first.kind ? callout.hole : null;
  return { kind: first.kind, count: first.count, hole, feats: kept, tier: callout.tier };
}

export function RoundTilePlot({
  shape,
  width = 340,
  height = 102, // 112px total plot footprint including the unchanged 10px seam.
  received,
}: {
  shape: HoleShape;
  width?: number;
  height?: number;
  /** FN1 — strokes received per played hole (feedStrokesReceived). */
  received?: readonly number[] | null;
}) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const values = received ? feedNetSeries(shape, received) : shape.series;
  if (!values || values.length < 2) return null;

  const { lo, hi } = roundPlotRange(values);
  const span = hi - lo;
  const top = 8;
  const bottom = height - 8;
  const xFor = (i: number) => PAD_X + (i / Math.max(values.length - 1, 1)) * (width - PAD_X * 2);
  const yFor = (v: number) => bottom - ((v - lo) / span) * (bottom - top);
  const points = values.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const path = smoothPath(points);
  const baselineY = yFor(0);
  const wentUnder = Math.min(...values) < 0;
  const dots = feedHoleDots(shape, received);
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
        {wentUnder ? (
          <UnderParGradientFill
            path={path} points={points} baselineY={baselineY} bottom={bottom} width={width}
            clipId={`feed-round-under-clip-${instanceId}`}
            gradientId={`feed-round-under-gradient-${instanceId}`}
            color={TOPAR_UNDER_DARK}
          />
        ) : null}
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
        {last && !dots.some((dot) => dot.i === points.length - 1) ? <circle cx={last.x} cy={last.y} r={2.6} fill={A.INK} /> : null}
      </svg>
    </div>
  );
}

export default RoundTilePlot;
