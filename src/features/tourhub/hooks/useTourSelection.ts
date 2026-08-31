/**
 * Tour selection helpers — storage + land-time live-first resolution.
 *
 * The tour hub picker persists the user's chosen tour to localStorage so
 * cold starts land on their preference. On land, however, we prefer to open
 * on a tour with a LIVE tournament: if the stored/default tour has none but
 * another tour does, we redirect to the highest-priority live tour.
 *
 * This is a land-time decision only. Once the user manually switches tours,
 * that choice is written to storage and wins for the rest of the session —
 * the redirect must NOT re-run on subsequent live-data refreshes.
 *
 * Priority when multiple tours are live:
 *   major > pga > lpga > euro > champ > liv > pgad
 *
 * NOTE: The active React state for tour selection lives in
 * TourSelectionContext. This module is intentionally storage/logic-only so
 * it can be unit-tested without React and shared across consumers.
 */

export const TOUR_STORAGE_KEY = 'tourhub:selectedTour';

/** Canonical tour slugs used by the hero carousel + picker. */
export const CANONICAL_TOUR_SLUGS = [
  'all',
  'pga',
  'lpga',
  'euro',
  'champ',
  'liv',
  'pgad',
  'major',
] as const;
export type CanonicalTourSlug = (typeof CANONICAL_TOUR_SLUGS)[number];

/** Land-time priority for live-first override. */
const LANDING_PRIORITY: readonly string[] = [
  'major',
  'pga',
  'lpga',
  'euro',
  'champ',
  'liv',
  'pgad',
];

export function readStoredTour(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return null;
    return (CANONICAL_TOUR_SLUGS as readonly string[]).includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredTour(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, slug);
  } catch {
    /* storage disabled — ignore */
  }
}

/**
 * Decide whether to override the stored tour at land-time.
 *
 * Returns the slug we should switch to, or `null` to keep the current
 * selection. Never returns the same slug as `stored`.
 */
export function resolveLandingTour(
  stored: string | null,
  liveSlugs: readonly string[],
): string | null {
  if (!liveSlugs || liveSlugs.length === 0) return null;
  // Stored tour is live — keep it.
  if (stored && liveSlugs.includes(stored)) return null;
  // Otherwise pick the highest-priority live tour.
  for (const p of LANDING_PRIORITY) {
    if (liveSlugs.includes(p)) return p === stored ? null : p;
  }
  const fallback = liveSlugs[0];
  return fallback && fallback !== stored ? fallback : null;
}
