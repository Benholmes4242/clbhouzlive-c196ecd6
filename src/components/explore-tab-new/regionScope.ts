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
 * the Course Index / courseRegions.ts scope predicate. Keeps toggle tokens
 * ('uk-ireland', 'continental-europe', 'rest-of-world') aligned with the
 * canonical keys ('gb-i', 'europe', 'rest') without introducing bespoke
 * per-section mappings.
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

