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
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { smoothPath } from '@/lib/charts/smoothPath';
import { FEED_CARD_SURFACE } from '@/lib/tokens/surfaces';
import { T40, T60 } from './feedTokens';

import {
  SC_FILL_GOLD,
  SC_BOGEY_DARK,
  SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import type { AchievementCallout } from '@/features/explore-magazine/cardTreatment';
import type { ExploreRoundFeat } from '@/features/explore-magazine/roundFeatCollection';
import { scorecardFeatFor, type ScorecardFeatKind } from '@/features/courses/_shared/scorecard/scorecardFeat';

// Signed-off line/strip supersedes BEA5/FUP1/FED1 presentation only.
// This module owns measured geometry and an in-memory session replay guard;
// callers supply score identity and retain all scorecard navigation.
// Only a completed draw consumes the session guard. Measurement changes or
// virtualised unmounts cancel unfinished work, which restarts at the threshold.
const playedRoundPlots = new Set<string>();
const PLOT_INK = '#F2F4F7';
const PLOT_HAIR = 'rgba(255,255,255,0.14)';
const PLOT_MISSING = 'rgba(255,255,255,0.06)';
const plotToPar = (n: number) => n === 0 ? 'E' : n > 0 ? `+${n}` : `−${Math.abs(n)}`;

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
/** FGD1 — grade GROSS minus par. The allowance feeds the trace and the fill
 *  only; the dots never take it, so this takes no parameter for it. */
export function feedHoleDots(shape: HoleShape | null | undefined): FeedDot[] {
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

export function RoundTilePlot({ shape, received, scoreId }: {
  shape: HoleShape;
  received?: readonly number[] | null;
  scoreId?: string | null;
}) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const revealRef = useRef<SVGRectElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const endRef = useRef<SVGCircleElement>(null);
  const [width, setWidth] = useState(0);
  const values = received ? feedNetSeries(shape, received) : shape.series;
  const { lo, hi } = roundPlotRange(values);
  const xFor = (i: number) => 16 + (i / Math.max(values.length - 1, 1)) * (width - 32);
  const yFor = (v: number) => 72 - ((v - lo) / (hi - lo)) * 64;
  const points = values.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const path = smoothPath(points);
  const baselineY = yFor(0);
  const wentUnder = Math.min(...values) < 0;
  const feat = feedFeat(shape);
  const last = points.at(-1);
  const completed = !!scoreId && playedRoundPlots.has(scoreId);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setWidth(root.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current, trace = pathRef.current;
    const reveal = revealRef.current, head = headRef.current, end = endRef.current;
    if (!root || !trace || !reveal || !head || !end || width <= 32) return;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    const finish = (animate = false) => {
      if (animate && scoreId) playedRoundPlots.add(scoreId);
      reveal.setAttribute('width', String(width));
      head.style.opacity = '0';
      end.style.transition = animate ? 'opacity 160ms ease, transform 220ms cubic-bezier(.3,1.6,.5,1)' : 'none';
      end.style.opacity = '1';
      end.style.transform = 'scale(1)';
    };
    if (completed || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    let samples: { x: number; y: number }[] = [];
    try {
      const length = trace.getTotalLength();
      if (!Number.isFinite(length) || length <= 0) throw new Error('Unavailable path length');
      samples = Array.from({ length: 240 }, (_, k) => {
        const p = trace.getPointAtLength(length * k / 239);
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('Unavailable path point');
        return { x: p.x, y: p.y };
      });
    } catch {
      finish();
      return;
    }
    reveal.setAttribute('width', '0');
    head.style.opacity = '0';
    end.style.opacity = '0';
    end.style.transform = 'scale(0.4)';
    const play = () => {
      if (started) return;
      started = true;
      if (scoreId && playedRoundPlots.has(scoreId)) { finish(); return; }
      timer = setTimeout(() => {
        const start = performance.now();
        head.style.opacity = '1';
        const step = (now: number) => {
          const t = Math.min(1, Math.max(0, (now - start) / 1200));
          const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
          const x = 16 + eased * (width - 32) + (t === 1 ? 16 : 0);
          reveal.setAttribute('width', String(x));
          const headX = Math.min(x, width - 16);
          let nearest = samples[0];
          for (const p of samples) if (nearest && Math.abs(p.x - headX) < Math.abs(nearest.x - headX)) nearest = p;
          head.setAttribute('cx', String(headX));
          if (nearest) head.setAttribute('cy', String(nearest.y));
          if (t < 1) frame = requestAnimationFrame(step);
          else finish(true);
        };
        frame = requestAnimationFrame(step);
      }, 120);
    };
    if (typeof IntersectionObserver === 'undefined') { finish(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.6)) { play(); observer.disconnect(); }
    }, { threshold: 0.6 });
    observer.observe(root);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [width, path, completed, scoreId]);

  if (values.length < 2) return null;
  return (
    <div ref={rootRef} data-feed-round-plot="true" style={{ position: 'relative', marginTop: 10 }}>
      {feat ? (
        <span data-feed-round-feat="true" style={{ position: 'absolute', top: -2, right: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Geist, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: SC_FILL_GOLD }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: SC_FILL_GOLD }} />{feat.word}
        </span>
      ) : null}
      <svg width="100%" height={96} viewBox={`0 0 ${width} 96`} aria-hidden style={{ display: 'block' }}>
        <defs>
          <clipPath id={`feed-reveal-${instanceId}`}><rect ref={revealRef} data-plot-reveal x={0} y={-10} width={completed ? width : 0} height={116} /></clipPath>
          {wentUnder ? <>
            <clipPath id={`feed-under-${instanceId}`} data-under-clip><rect x={0} y={baselineY} width={width} height={Math.max(72 - baselineY, 0)} /></clipPath>
            <linearGradient id={`feed-gradient-${instanceId}`} gradientUnits="userSpaceOnUse" x1={0} y1={baselineY} x2={0} y2={72}>
              <stop offset="0%" stopColor={TOPAR_UNDER_DARK} stopOpacity={0.06} /><stop offset="100%" stopColor={TOPAR_UNDER_DARK} stopOpacity={0.32} />
            </linearGradient>
          </> : null}
        </defs>
        {wentUnder ? <line data-plot-level x1={16} x2={width - 16} y1={baselineY} y2={baselineY} stroke={PLOT_HAIR} strokeWidth={1} strokeDasharray="2 4" /> : null}
        <g data-plot-animated clipPath={`url(#feed-reveal-${instanceId})`}>
          {wentUnder && last ? <path data-round-under-par-fill d={`${path} L${last.x},${baselineY} L16,${baselineY} Z`} fill={`url(#feed-gradient-${instanceId})`} clipPath={`url(#feed-under-${instanceId})`} /> : null}
          <path ref={pathRef} data-plot-trace d={path} fill="none" stroke={PLOT_INK} strokeOpacity={0.92} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {wentUnder ? <path data-plot-under-stroke d={path} fill="none" stroke={TOPAR_UNDER_DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#feed-under-${instanceId})`} /> : null}
        </g>
        {shape.holes.map((hole, i) => {
          const count = values.length - 1;
          if (i >= count) return null;
          const left = xFor(i) + (i === 0 ? 0 : count === 18 && i === 9 ? 3.5 : 1.25);
          const right = xFor(i + 1) - (i === count - 1 ? 0 : count === 18 && i === 8 ? 3.5 : 1.25);
          const d = hole.par == null || hole.strokes == null ? null : hole.strokes - hole.par;
          const fill = d == null ? PLOT_MISSING : d <= -2 ? SC_FILL_GOLD : d === -1 ? TOPAR_UNDER_DARK : d === 0 ? PLOT_HAIR : d === 1 ? SC_BOGEY_DARK : SC_DOUBLE_DARK;
          return <rect key={i} data-plot-hole={i + 1} x={left} y={90} width={Math.max(0, right - left)} height={6} rx={2} fill={fill} fillOpacity={d === 1 ? 0.55 : 1} />;
        })}
        <circle ref={headRef} data-plot-head cx={16} cy={points[0]?.y} r={3} fill={PLOT_INK} style={{ opacity: 0 }} />
        {last ? <circle ref={endRef} data-plot-end cx={last.x} cy={last.y} r={4} fill={PLOT_INK} stroke={FEED_CARD_SURFACE} strokeWidth={2} style={{ opacity: completed ? 1 : 0, transform: completed ? 'scale(1)' : 'scale(0.4)', transformOrigin: `${last.x}px ${last.y}px` }} /> : null}
      </svg>
      {shape.holes.length === 18 && values.length === 19 ? <div data-plot-foot style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', fontVariantNumeric: 'tabular-nums', color: T40 }}>
        <span>OUT <b style={{ color: T60 }}>{plotToPar(values[9])}</b></span><span>IN <b style={{ color: T60 }}>{plotToPar(values[18] - values[9])}</b></span>
      </div> : null}
    </div>
  );
}

export default RoundTilePlot;
