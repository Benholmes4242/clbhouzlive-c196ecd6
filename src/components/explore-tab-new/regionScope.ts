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
 * Map the Discover toggle slug to the compact rail cache-region key used by
 * `discover_rail_cache` (rows are keyed as `records:{r}`, `feats:{r}:{tier}`,
 * `legendary_leaders:{r}`, `eagle_leaders:{r}` where {r} is one of these
 * values). Null / undefined → 'worldwide'.
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
    default:
      return 'worldwide';
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
