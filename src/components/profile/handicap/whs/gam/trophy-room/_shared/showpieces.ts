/**
 * Showpiece achievements get special tier-escalating chrome in TrophyCard.
 *
 * As the user crosses counter_tiers thresholds, the card visually evolves from
 * locked → common → uncommon → rare → epic → legendary. This is distinct from
 * the catalogue's `rarity` field, which sets a static chrome for non-showpieces.
 */
export const SHOWPIECE_BADGE_IDS = new Set<string>([
  'first_birdie',
  'first_eagle',
  'first_albatross',
  'hole_in_one',
]);

export function isShowpiece(badgeId: string | undefined): boolean {
  if (!badgeId) return false;
  return SHOWPIECE_BADGE_IDS.has(badgeId);
}

/**
 * Regional Top 100 achievements get a purpose-built detail sheet showing
 * played/unplayed course lists, rather than the generic AchievementBody.
 *
 * Keep this list in sync with the regional Top 100 rows in gam_badge_catalogue.
 */
export const TOP_100_BADGE_IDS = new Set<string>([
  'top_100_worldwide',
  'top_100_usa',
  'top_100_gbni',
  'top_100_europe',
]);

export function isTop100Achievement(badgeId: string | undefined): boolean {
  if (!badgeId) return false;
  return TOP_100_BADGE_IDS.has(badgeId);
}

/**
 * Maps a Top 100 badge ID to the corresponding `top100_lists.slug`.
 * Returns null for badges that are not regional Top 100s.
 */
export function top100BadgeIdToListSlug(badgeId: string): string | null {
  switch (badgeId) {
    case 'top_100_worldwide': return 'global';
    case 'top_100_usa':       return 'usa';
    case 'top_100_gbni':      return 'gb-i';
    case 'top_100_europe':    return 'europe';
    default:                  return null;
  }
}
