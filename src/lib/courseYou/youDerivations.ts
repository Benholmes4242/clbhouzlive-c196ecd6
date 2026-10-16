/**
 * BRIEF_YOU_TAB_1 / 1A — THE YOU TAB'S DATA LAYER (Phase 1). Pure functions only.
 *
 * P1.1 Every aggregate here is computed over the viewer's COMPLETE 18-hole
 * history at the course (useAllMyRoundsAtCourse, the paging read the all-rounds
 * sheet uses). The 20-round useMyRoundsAtCourse read is NOT an input to any
 * aggregate on the played state.
 *
 * P1.2 fieldExcludingViewer is the ONE home of "the field excluding the
 * viewer" at course level. It is arithmetic on values already on the page; no
 * SQL, no RPC. It returns null whenever it cannot be computed honestly.
 *
 * P1.3 Per-hole field figures come from get_course_hole_field (which excludes
 * the viewer), converted to over-par with that hole's par from
 * get_course_hole_analysis. get_course_hole_analysis's own avg_to_par INCLUDES
 * the viewer and is never used for a comparison here.
 *
 * P1.4 edgeConsistency guards P1.2 against P1.3 (see youTabDerivations.test).
 *
 * P1.5 A null nine is EXCLUDED, never zeroed; every nine figure carries the
 * count of rounds it rests on.
 *
 * P1.6 lastN is the ONE definition of "last 20". Both readers use it.
 */

export interface YouRoundInput {
  whsScoreId: string;
  playDate: string;
  grossScore: number | null;
  coursePar: number | null;
  frontNineToPar: number | null;
  backNineToPar: number | null;
}

/** A season below this many rounds is omitted (P2.4) and has no ladder row (P2.2). */
export const SEASON_MIN_ROUNDS = 5;
/** "Broke 75": a gross strictly below this. */
export const GOOD_ROUND_GROSS = 75;
/** Below this many good rounds the "small set, whole set" line renders (P3.1). */
export const SMALL_SET = 10;
/** One hole left renders with at most this many unbirdied holes (P4.1). */
export const HANDFUL = 3;
/** An edge at or below this many shots per hole is "level" (P3.4). */
export const LEVEL_EDGE = 0.05;
/** P1.4 — the per-hole gaps must sum to the course gap within this many shots. */
export const EDGE_TOLERANCE = 0.3;
/** P1.6 — the one "last N". */
export const LAST_N = 20;

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const mean = (xs: number[]): number | null =>
  xs.length > 0 ? xs.reduce((s, v) => s + v, 0) / xs.length : null;

/** Round half away from zero to one decimal, so 77.55 prints 77.6. */
export function round1(v: number): number {
  const s = Math.sign(v);
  return (s * Math.round(Math.abs(v) * 10 + 1e-9)) / 10;
}

export const yearOf = (playDate: string): number => Number(playDate.slice(0, 4));

/** Rounds with a gross, newest first, deterministic. */
export function scoredRounds<R extends YouRoundInput>(rounds: R[]): R[] {
  return rounds
    .filter((r) => finite(r.grossScore))
    .sort((a, b) => b.playDate.localeCompare(a.playDate) || b.whsScoreId.localeCompare(a.whsScoreId));
}

export const toParOf = (r: YouRoundInput): number | null =>
  finite(r.grossScore) && finite(r.coursePar) ? r.grossScore - r.coursePar : null;

export interface Aggregate {
  count: number;
  avgGross: number | null;
  /** Over rounds carrying a course par; `overParCount` states that denominator. */
  avgOverPar: number | null;
  overParCount: number;
  best: number | null;
}

export function aggregate(rounds: YouRoundInput[]): Aggregate {
  const gross = rounds.map((r) => r.grossScore).filter(finite);
  const over = rounds.map(toParOf).filter(finite);
  return {
    count: gross.length,
    avgGross: mean(gross),
    avgOverPar: mean(over),
    overParCount: over.length,
    best: gross.length > 0 ? Math.min(...gross) : null,
  };
}

export interface Season extends Aggregate {
  year: number;
}

/** Every season with at least one round, oldest first. */
export function allSeasons(rounds: YouRoundInput[]): Season[] {
  const byYear = new Map<number, YouRoundInput[]>();
  for (const r of scoredRounds(rounds)) {
    const y = yearOf(r.playDate);
    if (!Number.isFinite(y)) continue;
    const list = byYear.get(y) ?? [];
    list.push(r);
    byYear.set(y, list);
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, list]) => ({ year, ...aggregate(list) }));
}

/** Seasons that clear SEASON_MIN_ROUNDS — the only ones drawn or compared. */
export const qualifyingSeasons = (rounds: YouRoundInput[]): Season[] =>
  allSeasons(rounds).filter((s) => s.count >= SEASON_MIN_ROUNDS);

/**
 * P1.6 — THE ONE "LAST N". `offset` skips the newest rounds, so
 * lastN(r, 20, 20) is "the twenty before". Returns null unless a full N exists.
 */
export function lastN(rounds: YouRoundInput[], n = LAST_N, offset = 0): { avg: number; rounds: YouRoundInput[] } | null {
  const slice = scoredRounds(rounds).slice(offset, offset + n);
  if (slice.length < n) return null;
  return { avg: mean(slice.map((r) => r.grossScore as number)) as number, rounds: slice };
}

/** The OLDEST n rounds' gross average, or null without a full n. */
export function firstN(rounds: YouRoundInput[], n: number): number | null {
  const all = scoredRounds(rounds);
  if (all.length < n) return null;
  return mean(all.slice(all.length - n).map((r) => r.grossScore as number));
}

/**
 * P1.2 — THE FIELD EXCLUDING THE VIEWER, course level.
 *   field_sum  = fieldAvgOverPar * fieldRounds        (field INCLUDES the viewer)
 *   viewer_sum = viewerAvgOverPar * viewerRounds
 *   result     = (field_sum - viewer_sum) / (fieldRounds - viewerRounds)
 */
export function fieldExcludingViewer(input: {
  fieldAvgOverPar: number | null | undefined;
  fieldRounds: number | null | undefined;
  viewerAvgOverPar: number | null | undefined;
  viewerRounds: number | null | undefined;
}): number | null {
  const { fieldAvgOverPar, fieldRounds, viewerAvgOverPar, viewerRounds } = input;
  if (!finite(fieldAvgOverPar) || !finite(fieldRounds) || !finite(viewerRounds)) return null;
  if (viewerRounds < 0 || fieldRounds <= 0) return null;
  if (viewerRounds >= fieldRounds) return null;
  if (viewerRounds === 0) return fieldAvgOverPar;
  if (!finite(viewerAvgOverPar)) return null;
  const rest = fieldRounds - viewerRounds;
  if (rest <= 0) return null;
  const v = (fieldAvgOverPar * fieldRounds - viewerAvgOverPar * viewerRounds) / rest;
  return Number.isFinite(v) ? v : null;
}

/* ---------- per hole (P1.3) ---------- */

export interface HoleParInput { hole_no: number; par: number }
export interface HoleFieldInput { hole_no: number; scored_count: number; avg_gross: number | null }
export interface HoleMineInput {
  hole_no: number;
  times_played: number;
  avg_to_par: number;
  birdie_count: number | null;
  eagle_or_better_count: number | null;
  ace_count: number | null;
}

export interface HoleEdge {
  hole_no: number;
  par: number;
  /** Field (excluding the viewer) over par, or null when unmeasured. */
  field: number | null;
  you: number | null;
  timesPlayed: number;
  /** field - you: positive means the viewer is AHEAD. Null when either side is absent. */
  edge: number | null;
  birdied: boolean;
}

export function holeEdges(
  pars: HoleParInput[],
  field: HoleFieldInput[],
  mine: HoleMineInput[],
): HoleEdge[] {
  const f = new Map(field.map((h) => [h.hole_no, h]));
  const m = new Map(mine.map((h) => [h.hole_no, h]));
  return [...pars]
    .filter((p) => finite(p.par))
    .sort((a, b) => a.hole_no - b.hole_no)
    .map((p) => {
      const fh = f.get(p.hole_no);
      const mh = m.get(p.hole_no);
      const fieldOver = fh && fh.scored_count > 0 && finite(fh.avg_gross) ? fh.avg_gross - p.par : null;
      const you = mh && mh.times_played > 0 && finite(mh.avg_to_par) ? mh.avg_to_par : null;
      return {
        hole_no: p.hole_no,
        par: p.par,
        field: fieldOver,
        you,
        timesPlayed: mh?.times_played ?? 0,
        edge: fieldOver != null && you != null ? fieldOver - you : null,
        birdied:
          (mh?.birdie_count ?? 0) > 0 || (mh?.eagle_or_better_count ?? 0) > 0 || (mh?.ace_count ?? 0) > 0,
      };
    });
}

export interface EdgeSummary {
  measured: HoleEdge[];
  unmeasured: number;
  behind: HoleEdge[];
  front: number | null;
  back: number | null;
  /** P3.4 — among the level holes, the one the FIELD finds hardest. */
  leastEdge: HoleEdge | null;
  /** The other level holes, distinguished in copy from leastEdge. */
  otherLevel: HoleEdge[];
  /** The field's easiest measured hole, so copy can say "easiest". */
  fieldEasiest: HoleEdge | null;
  fieldHardest: HoleEdge | null;
}

export function edgeSummary(edges: HoleEdge[]): EdgeSummary {
  const measured = edges.filter((e) => e.edge != null);
  const sumOf = (from: number, to: number) => {
    const set = measured.filter((e) => e.hole_no >= from && e.hole_no <= to);
    return set.length > 0 ? set.reduce((s, e) => s + (e.edge as number), 0) : null;
  };
  /* P3.4: the smallest edges are the "level" set; with none level, the single
     smallest. Within it, the field's own difficulty decides. */
  let level = measured.filter((e) => (e.edge as number) <= LEVEL_EDGE);
  if (level.length === 0 && measured.length > 0) {
    const min = Math.min(...measured.map((e) => e.edge as number));
    level = measured.filter((e) => e.edge === min);
  }
  const leastEdge = level.reduce<HoleEdge | null>(
    (best, e) => (best == null || (e.field as number) > (best.field as number) ? e : best),
    null,
  );
  const withField = edges.filter((e) => e.field != null);
  return {
    measured,
    unmeasured: edges.length - measured.length,
    behind: measured.filter((e) => (e.edge as number) < 0),
    front: sumOf(1, 9),
    back: sumOf(10, 18),
    leastEdge,
    otherLevel: level.filter((e) => e !== leastEdge),
    fieldEasiest: withField.reduce<HoleEdge | null>((m, e) => (m == null || (e.field as number) < (m.field as number) ? e : m), null),
    fieldHardest: withField.reduce<HoleEdge | null>((m, e) => (m == null || (e.field as number) > (m.field as number) ? e : m), null),
  };
}

/** P1.4 — do the per-hole gaps agree with the course-level gap? */
export function edgeConsistency(edges: HoleEdge[], courseGap: number) {
  const holeSum = edges.reduce((s, e) => s + (e.edge ?? 0), 0);
  const diff = Math.abs(holeSum - courseGap);
  return { holeSum, courseGap, diff, ok: diff <= EDGE_TOLERANCE };
}

/* ---------- good rounds (P3.1 / P3.2 / P1.5) ---------- */

export interface NineGroup {
  count: number;
  avgGross: number | null;
  /** Rounds with BOTH nines present — the denominator of front/back. */
  nineCount: number;
  front: number | null;
  back: number | null;
}

function nineGroup(rounds: YouRoundInput[]): NineGroup {
  const withNines = rounds.filter((r) => finite(r.frontNineToPar) && finite(r.backNineToPar));
  return {
    count: rounds.length,
    avgGross: mean(rounds.map((r) => r.grossScore as number)),
    nineCount: withNines.length,
    front: mean(withNines.map((r) => r.frontNineToPar as number)),
    back: mean(withNines.map((r) => r.backNineToPar as number)),
  };
}

export interface GoodRounds {
  threshold: number;
  good: NineGroup;
  other: NineGroup;
  total: number;
  /** Every good round with a split had its front lower than its back. */
  everyMadeBeforeTurn: boolean;
  /** Every good round with a split turned under par. */
  everyTurnUnderPar: boolean;
}

/** P3.2 — null when the viewer has never broken the threshold. Never lowered. */
export function goodRounds(rounds: YouRoundInput[], threshold = GOOD_ROUND_GROSS): GoodRounds | null {
  const all = scoredRounds(rounds);
  const good = all.filter((r) => (r.grossScore as number) < threshold);
  if (good.length === 0) return null;
  const other = all.filter((r) => (r.grossScore as number) >= threshold);
  const split = good.filter((r) => finite(r.frontNineToPar) && finite(r.backNineToPar));
  return {
    threshold,
    good: nineGroup(good),
    other: nineGroup(other),
    total: all.length,
    everyMadeBeforeTurn: split.length > 0 && split.every((r) => (r.frontNineToPar as number) < (r.backNineToPar as number)),
    everyTurnUnderPar: split.length > 0 && split.every((r) => (r.frontNineToPar as number) < 0),
  };
}

/* ---------- one hole left (P4.1) ---------- */

export type OpenHolesState =
  | { kind: 'complete'; total: number }
  | { kind: 'open'; open: HoleEdge[]; total: number }
  | { kind: 'none' };

export function openHolesState(edges: HoleEdge[]): OpenHolesState {
  if (edges.length === 0) return { kind: 'none' };
  const open = edges.filter((e) => !e.birdied);
  if (open.length === 0) return { kind: 'complete', total: edges.length };
  if (open.length > HANDFUL) return { kind: 'none' };
  return { kind: 'open', open, total: edges.length };
}
