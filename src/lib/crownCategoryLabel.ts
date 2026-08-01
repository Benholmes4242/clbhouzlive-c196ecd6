/**
 * Crown category slug -> human label (BRIEF_ROUND_CROWN_WIRING).
 *
 * Locale-backed via common:feed.crownCategory.*. Any category not in the map
 * (new server-side categories) falls back to the slug with underscores turned
 * into spaces, so a sentence never prints a raw slug.
 */
import i18n from 'i18next';

const KNOWN = new Set([
  'lowest_gross_all_time',
  'best_score_diff_all_time',
  'best_stableford_all_time',
  'most_aces_all_time',
  'most_albatrosses_all_time',
  'most_eagles_all_time',
  'most_birdies_all_time',
]);

export function crownCategoryLabel(category: string | null | undefined): string {
  if (!category) return '';
  const fallback = category.replace(/_/g, ' ');
  if (!KNOWN.has(category)) return fallback;
  return i18n.t(`feed.crownCategory.${category}`, {
    ns: 'common',
    defaultValue: fallback,
  }) as string;
}
