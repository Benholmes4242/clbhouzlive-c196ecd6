/**
 * REGION AND NATION COUNTS (BRIEF_COURSES_DISCOVERY §C) — A TYPED STUB.
 *
 * The counts are expensive to compute live and the function that serves them
 * is hand-run separately; this build must not invent one. Until it lands both
 * hooks return `rows: null`, and the blocks render nothing (an empty block
 * never shows a heading over nothing). Wire the source HERE when it exists.
 *
 * "ACTIVE" = a course carrying a round or a rating — never the catalogue total.
 */
export interface RegionActivityRow {
  region: string;
  /** Active courses the viewer has not played. */
  toDiscover: number;
  /** Active courses the viewer has played. */
  played: number;
  /** Active courses in the region. */
  active: number;
  imageUrl: string | null;
}

export interface NationActivityRow {
  nation: string;
  /** Active courses. Zero renders greyed "Nothing yet" and is not a link. */
  active: number;
}

export function useRegionActivity(_enabled: boolean): { rows: RegionActivityRow[] | null; isFetched: boolean } {
  return { rows: null, isFetched: true };
}

export function useNationActivity(_enabled: boolean): { rows: NationActivityRow[] | null; isFetched: boolean } {
  return { rows: null, isFetched: true };
}
