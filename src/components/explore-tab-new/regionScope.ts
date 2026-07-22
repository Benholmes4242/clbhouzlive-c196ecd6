import { dbValueToRegionKey, type PrimaryRegionKey } from '@/constants/courseRegions';

/**
 * Maps the Discover region toggle slug to its natural-language phrase
 * used inside dynamic section titles like "Toughest courses {scope}".
 */
export function regionScopePhrase(slug: string | null | undefined): string {
  switch (slug) {
    case 'uk-ireland':
      return 'in GB&I';
    case 'usa':
      return 'in the USA';
    case 'continental-europe':
      return 'in Europe';
    case 'rest-of-world':
      return 'in the rest of the world';
    case null:
    case undefined:
    default:
      return 'in the world';
  }
}

/**
 * Convert a Discover toggle slug to the app-wide PrimaryRegionKey used by
 * the Course Index / courseRegions.ts scope predicate.
 */
export function discoverSlugToRegionKey(
  slug: string | null | undefined,
): PrimaryRegionKey {
  switch (slug) {
    case 'uk-ireland':
      return 'gb-i';
    case 'usa':
      return 'usa';
    case 'continental-europe':
      return 'europe';
    case 'rest-of-world':
      return 'rest';
    default:
      return 'all';
  }
}

/**
 * Map the cached-rail region key vocabulary
 * ('gbi' | 'usa' | 'europe' | 'row') to the canonical PrimaryRegionKey.
 * Cached rails use these compact keys inside `payload[i].region`.
 */
export function railKeyToRegionKey(
  key: string | null | undefined,
): PrimaryRegionKey | null {
  switch (key) {
    case 'gbi':
      return 'gb-i';
    case 'usa':
      return 'usa';
    case 'europe':
      return 'europe';
    case 'row':
      return 'rest';
    default:
      return null;
  }
}

/**
 * Shared scope predicate for the Discover region toggle. Feeds the payload's
 * country/region strings through `dbValueToRegionKey` — the same util the
 * sternest-tests Course Index and the rest of the app use to decide which
 * primary region a course belongs to. Worldwide (slug === null) is always
 * a passthrough.
 */
export function matchesRegionScope(
  slug: string | null | undefined,
  country: string | null | undefined,
  region?: string | null | undefined,
): boolean {
  const key = discoverSlugToRegionKey(slug);
  if (key === 'all') return true;
  const itemKey = dbValueToRegionKey(country ?? region ?? null);
  return itemKey === key;
}

/**
 * Companion predicate for cached rail payloads that carry the compact
 * region key vocabulary ('gbi' | 'usa' | 'europe' | 'row') per item.
 * Worldwide passes through everything.
 *
 * NOTE: Only the hardest/easiest holes rail should still use this — its
 * payload genuinely carries per-item region/country. The leader rails
 * (records / birdie_hauls / honours / eagles) fetch a per-region cache
 * row directly via slugToCacheRegion — do not filter their payloads
 * with this predicate.
 */
export function matchesRailRegionScope(
  slug: string | null | undefined,
  itemRailKey: string | null | undefined,
): boolean {
  const key = discoverSlugToRegionKey(slug);
  if (key === 'all') return true;
  const mapped = railKeyToRegionKey(itemRailKey);
  return mapped === key;
}

/**
 * Map the Discover region toggle slug to the compact cache-region key
 * used inside `discover_rail_cache.rail_key` (e.g. `records:gbi`,
 * `feats:usa:eagles`). Single source of truth for that mapping.
 */
export function slugToCacheRegion(slug: string | null | undefined): string {
  switch (slug) {
    case 'uk-ireland':
      return 'gbi';
    case 'usa':
      return 'usa';
    case 'continental-europe':
      return 'europe';
    case 'rest-of-world':
      return 'row';
    case null:
    case undefined:
    default:
      return 'worldwide';
  }
}
