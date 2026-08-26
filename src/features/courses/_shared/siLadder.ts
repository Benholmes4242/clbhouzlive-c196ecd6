/**
 * BRIEF_SI_LADDER_SHARED §1 — THE RULE, AND IT LIVES HERE ONCE.
 *
 * The same course must never show different flags on the course detail Course
 * tab and on the club analytics page. Both data sources already carry
 * everything the rule needs per hole:
 *
 *   get_course_hole_analysis   -> stroke_index, avg_to_par, rounds  (Course tab)
 *   get_club_course_analytics  -> stroke_index, avg_to_par, rounds  (club page)
 *
 * So NEITHER PAGE COMPUTES A THRESHOLD. They call `buildSiLadder` and render
 * what it returns. Implementing this twice is how the two surfaces start
 * disagreeing about the same golf course.
 *
 * DEBT, NAMED NOT FIXED: get_club_course_analytics also returns `places_gap`
 * and `shots_gap`, added in an earlier pass. They are now REDUNDANT — this
 * helper computes both — and they are DELIBERATELY NOT READ anywhere. The
 * fields stay on the RPC (removing them is another SQL pass) and are reported
 * as unused so they can be dropped later. Do not wire them back in: the whole
 * point is that one TypeScript function owns the verdict.
 *
 * WHAT THIS IS NOT (§5): there is no personal variant and no "your rounds"
 * toggle. 507 member-course pairs exist, only 48 clear 10 rounds (mean 6.7), so
 * a personal ladder would be locked for nine members in ten. Nothing here is
 * scoped around a viewer, which is also why adding one later would not mean
 * rewriting this.
 */

/** The one shape both RPCs reduce to. Nulls are expected and handled. */
export interface SiLadderHoleInput {
  hole_no: number;
  stroke_index: number | null;
  avg_to_par: number | null;
}

export type SiLadderDirection = 'harder' | 'easier';

export interface SiLadderRow {
  holeNo: number;
  /** The DECLARED stroke index, from the club's card. */
  strokeIndex: number;
  avgToPar: number;
  /** 1 = hardest. UNIQUE across the 18 — see the tie note below. */
  measuredRank: number;
  /** measuredRank - strokeIndex. NEGATIVE = plays HARDER than indexed. */
  placesGap: number;
  /** avg_to_par minus what the declared index position actually returns. */
  shotsGap: number;
  flagged: boolean;
  /** NULL unless flagged. Colour comes from THIS, never from a line's slope. */
  direction: SiLadderDirection | null;
}

export interface SiLadder {
  /** In card order. Sorting for display is the chart's business, not the rule's. */
  rows: SiLadderRow[];
  /** Flagged rows, hardest measured position first. */
  flagged: SiLadderRow[];
  /** Standard deviation of avg_to_par across the holes. */
  sd: number;
  /** The scaled shots threshold this course was judged against. */
  shotsFloor: number;
  /** Rounds behind the measurement, for the panel's basis line. */
  rounds: number;
}

/**
 * ELIGIBILITY IS THE WHOLE CHART, NOT PER HOLE (§1). Below this the section
 * DOES NOT RENDER: no empty state, no placeholder, no greyed chart. It appears
 * by itself once a course crosses the line.
 */
export const SI_LADDER_MIN_ROUNDS = 100;

/** Places out of position. Places alone flags rank noise, hence the pair. */
export const SI_PLACES_GATE = 4;

/** The absolute floor, so an extremely flat course cannot flag hundredths. */
export const SI_SHOTS_FLOOR_MIN = 0.05;

/**
 * THE THRESHOLD IS SCALED TO THE COURSE, NOT FIXED.
 *
 * A fixed 0.10 is a fraction of one course's spread and a different fraction of
 * another's, so the rule silently gets stricter on flatter courses. sd/3 keeps
 * it proportionate. At Sundridge Park East, sd = 0.2018 across the 18 holes,
 * giving a floor of 0.0673 — LOWER than the fixed 0.10 that preceded it — and
 * the flagged set is unchanged: holes 18, 15 and 10.
 */
export function siShotsFloor(sd: number): number {
  return Math.max(SI_SHOTS_FLOOR_MIN, sd / 3);
}

/**
 * Ranks are UNIQUE, ties broken by hole number.
 *
 * This is deliberate and it is a correction. SQL `RANK()` gives two holes
 * sharing a mean the same rank and then SKIPS the next one — at Sundridge East,
 * holes 15 and 4 both returned +0.68 and took rank 6, so rank 7 did not exist
 * and every hole whose declared index was 7 had NO implied score to measure
 * against. Hole 10 fell out of the flagged set for that reason alone. A unique
 * rank per hole also matches the chart, whose right-hand scale has exactly one
 * row per position from 1 to 18.
 */
export function buildSiLadder(
  holes: SiLadderHoleInput[] | null | undefined,
  totalRounds: number | null | undefined,
): SiLadder | null {
  const rounds = totalRounds ?? 0;
  if (rounds < SI_LADDER_MIN_ROUNDS) return null;

  const usable = (holes ?? []).filter(
    (h): h is SiLadderHoleInput & { stroke_index: number; avg_to_par: number } =>
      h != null &&
      typeof h.stroke_index === 'number' &&
      typeof h.avg_to_par === 'number' &&
      Number.isFinite(h.avg_to_par),
  );
  // A partial card cannot be ranked against itself: the implied lookup needs a
  // hole at every declared position.
  if (usable.length < 2) return null;

  const ranked = [...usable]
    .sort((a, b) => b.avg_to_par - a.avg_to_par || a.hole_no - b.hole_no)
    .map((h, i) => ({ ...h, measuredRank: i + 1 }));

  const byRank = new Map(ranked.map((h) => [h.measuredRank, h.avg_to_par]));

  const values = ranked.map((h) => h.avg_to_par);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  const shotsFloor = siShotsFloor(sd);

  const rows: SiLadderRow[] = ranked.map((h) => {
    const implied = byRank.get(h.stroke_index);
    const placesGap = h.measuredRank - h.stroke_index;
    const shotsGap = implied == null ? 0 : h.avg_to_par - implied;
    const flagged =
      implied != null && Math.abs(placesGap) >= SI_PLACES_GATE && Math.abs(shotsGap) >= shotsFloor;
    return {
      holeNo: h.hole_no,
      strokeIndex: h.stroke_index,
      avgToPar: h.avg_to_par,
      measuredRank: h.measuredRank,
      placesGap,
      shotsGap,
      flagged,
      // NEGATIVE placesGap means the hole sits ABOVE its declared position on
      // the measured order, i.e. it plays HARDER than the card says.
      direction: flagged ? (placesGap < 0 ? 'harder' : 'easier') : null,
    };
  });

  rows.sort((a, b) => a.holeNo - b.holeNo);

  return {
    rows,
    flagged: rows.filter((r) => r.flagged).sort((a, b) => a.measuredRank - b.measuredRank),
    sd,
    shotsFloor,
    rounds,
  };
}
