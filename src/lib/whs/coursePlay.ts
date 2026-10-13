/**
 * BRIEF_YOU_TAB_BRANCH_C_SCOUTING_REPORT §1 — THE ONE HOME for converting
 * between a handicap differential and a gross score at a given course.
 * Nothing else in the app may do this arithmetic inline.
 *
 * Pure functions only: no React, no supabase, no formatting, no i18n.
 */

export interface CoursePlayInputs {
  index: number;
  cr: number;
  slope: number;
  par: number;
}

/** WHS course handicap. Standard Math.round (half up). */
export function courseHandicap(i: CoursePlayInputs): number {
  return Math.round(i.index * (i.slope / 113) + (i.cr - i.par));
}

/** Inverse of the WHS differential formula. Unrounded; callers round for display. */
export function grossFromDifferential(diff: number, cr: number, slope: number): number {
  return cr + diff * (slope / 113);
}

/** Nearest-rank percentile, 1-based. No interpolation. */
export function nearestRankPercentile(ascending: number[], p: number): number {
  const index = Math.min(ascending.length, Math.max(1, Math.ceil(p * ascending.length)));
  return ascending[index - 1];
}

/** Median; null when empty. The typical projection never uses the mean. */
export function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export interface CourseProjection {
  typicalGross: number;
  lowGross: number;
  highGross: number;
  courseHcp: number;
  sampleSize: number;
}

export const MIN_PROJECTION_DIFFERENTIALS = 8;

export function buildCourseProjection(
  differentials: number[],
  i: CoursePlayInputs,
): CourseProjection | null {
  const sorted = differentials.filter((d) => Number.isFinite(d)).sort((a, b) => a - b);
  if (sorted.length < MIN_PROJECTION_DIFFERENTIALS) return null;
  return {
    typicalGross: Math.round(grossFromDifferential(medianOf(sorted)!, i.cr, i.slope)),
    lowGross: Math.round(grossFromDifferential(nearestRankPercentile(sorted, 0.1), i.cr, i.slope)),
    highGross: Math.round(grossFromDifferential(nearestRankPercentile(sorted, 0.9), i.cr, i.slope)),
    courseHcp: courseHandicap(i),
    sampleSize: sorted.length,
  };
}

/** How many finite differentials convert to a gross at or under the target. */
export function timesPlayedToStandard(
  differentials: number[],
  targetGross: number,
  cr: number,
  slope: number,
): number {
  return differentials.filter(
    (d) => Number.isFinite(d) && grossFromDifferential(d, cr, slope) <= targetGross,
  ).length;
}

export function axisScale(
  lowGross: number,
  highGross: number,
  recordGross: number | null,
): { lo: number; hi: number; pos: (x: number) => number } {
  const lo = Math.floor(Math.min(lowGross, recordGross ?? lowGross)) - 3;
  const hi = Math.ceil(Math.max(highGross, recordGross ?? highGross)) + 3;
  return { lo, hi, pos: (x: number) => ((x - lo) / (hi - lo)) * 100 };
}
