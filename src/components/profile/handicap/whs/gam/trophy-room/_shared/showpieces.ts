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
