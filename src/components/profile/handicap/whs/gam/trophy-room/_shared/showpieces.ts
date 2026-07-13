/**
 * Showpiece achievements get the Option B card treatment in the Trophy Room:
 * big hero counter, animated progress bar to next tier, inline next-tier
 * signpost. Rendered in a dedicated "Lifetime" section above the categorised
 * achievements.
 */
export const SHOWPIECE_BADGE_IDS = new Set<string>([
  // Lifetime accumulation showpieces (counter is unbounded)
  'first_birdie',
  'first_eagle',
  'hole_in_one',
  // Bounded-set showpieces (counter capped at 100)
  'top_100_worldwide',
  'top_100_usa',
  'top_100_gbni',
  'top_100_europe',
]);

export function isShowpiece(badgeId: string | undefined): boolean {
  if (!badgeId) return false;
  return SHOWPIECE_BADGE_IDS.has(badgeId);
}

/** Fixed render order for the Lifetime section. */
export const LIFETIME_ORDER: string[] = [
  'first_birdie',
  'first_eagle',
  'hole_in_one',
  'top_100_worldwide',
  'top_100_gbni',
  'top_100_europe',
  'top_100_usa',
];

/**
 * Caption answers "<number> of what?". Auto-shortened by
 * `shortenShowpieceCaption` for the grid card.
 */
export const SHOWPIECE_COUNTER_LABEL: Record<string, string> = {
  first_birdie: 'Lifetime birdies',
  first_eagle: 'Lifetime eagles',
  // hole_in_one intentionally omitted — card label derives from
  // gam_badge_catalogue.title like every other badge.
  top_100_worldwide: 'of World Top 100 played',
  top_100_usa:       'of USA Top 100 played',
  top_100_gbni:      'of GB&I Top 100 played',
  top_100_europe:    'of Europe Top 100 played',
};

export function shortenShowpieceCaption(caption: string): string {
  return caption
    .replace(/^Lifetime /i, '')
    .replace(/^of /i, '')
    .replace(/ played$/i, '');
}

export const SHOWPIECE_LOCKED_HINT: Record<string, string> = {
  first_birdie: 'First birdie unlocks this',
  first_eagle: 'First eagle unlocks this',
  hole_in_one: 'First ace unlocks this',
  top_100_worldwide: 'Play your first World Top 100 course',
  top_100_usa: 'Play your first USA Top 100 course',
  top_100_gbni: 'Play your first GB&I Top 100 course',
  top_100_europe: 'Play your first Europe Top 100 course',
};

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
