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
 * All Intelligence Picks bottom sheet).
 */

/** Major tournament name matching (sr_tournaments has no is_major column). */
export const MAJOR_NAMES = [
  'masters tournament',
  'u.s. open',
  'pga championship',
  'the open championship',
];

/** Exclude senior/women/junior/amateur events that would otherwise match MAJOR_NAMES via substring. */
export const MAJOR_EXCLUSIONS = ['senior', 'women', 'junior', 'amateur'];

export function isMajor(name: string): boolean {
  const lower = name.toLowerCase();
  if (MAJOR_EXCLUSIONS.some((ex) => lower.includes(ex))) return false;
  return MAJOR_NAMES.some((k) => lower.includes(k));
}
