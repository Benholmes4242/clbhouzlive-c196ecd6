/**
 * majorScope — shared major-tournament name matching for cross-tour
 * PGA-effective scope.
 *
 * The Masters and other co-sanctioned majors live under non-PGA seasons
 * (e.g. EURO) in `sr_seasons`. Hooks that build a "PGA-effective" view
 * of completed tournaments must include these majors and exclude
 * non-PGA-equivalent events (senior / women / junior / amateur fields)
 * that would otherwise match on substring.
 *
 * Single source of truth — imported by `useIntelligenceHistoricalPicks`
 * (which powers the hero card track record, the Pick Record rail, and the
 * All Intelligence Picks bottom sheet) and `useHeroCarouselData` for the
 * MAJOR badge swap.
 */

/** Major tournament name matching (sr_tournaments has no is_major column). */
export const MAJOR_NAMES = [
  'masters tournament',
  'u.s. open',
  'pga championship',
  'the open championship',
];

/**
 * Exclude senior/women/junior/amateur events (and BMW PGA Championship — a
 * regular DP World event at Wentworth that substring-matches 'pga championship')
 * that would otherwise match MAJOR_NAMES via substring.
 */
export const MAJOR_EXCLUSIONS = ['senior', 'women', 'junior', 'amateur', 'bmw'];

/** Women's majors — separate list because the men's exclusions filter out 'women'. */
export const WOMENS_MAJORS = [
  'chevron championship',
  "u.s. women's open",
  "kpmg women's pga championship",
  'amundi evian championship',
  "aig women's open",
];

export function isMajor(name: string): boolean {
  const lower = name.toLowerCase();
  if (MAJOR_EXCLUSIONS.some((ex) => lower.includes(ex))) return false;
  return MAJOR_NAMES.some((k) => lower.includes(k));
}

export function isWomensMajor(name: string): boolean {
  const lower = name.toLowerCase();
  return WOMENS_MAJORS.some((m) => lower.includes(m));
}

/** Returns 'mens' | 'womens' | null. Women's check runs first (more specific). */
export function getMajorType(name: string): 'mens' | 'womens' | null {
  if (isWomensMajor(name)) return 'womens';
  if (isMajor(name)) return 'mens';
  return null;
}

export function isAnyMajor(name: string): boolean {
  return getMajorType(name) !== null;
}
