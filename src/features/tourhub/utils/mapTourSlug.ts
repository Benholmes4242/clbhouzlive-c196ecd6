import type { TourId } from '../hooks/useOverviewData';

/**
 * Normalise a stored tour_name (Sportradar tour.alias — e.g. "champions-tour",
 * "PGA Tour Champions", "DP World Tour") to a canonical TourId. Uses SUBSTRING
 * matching to mirror the backend deriveTourSlug (tournament-live-sync), so
 * frontend bucketing matches what the hero/sync layer produces.
 *
 * Order matters: check the most specific tokens first (liv, lpga, dp world,
 * champions, korn ferry) before the generic 'pga' catch, because several
 * alias strings contain "pga" (e.g. "PGA Tour Champions").
 */
export function mapTourSlug(tourName: string): TourId {
  const name = (tourName ?? '').toLowerCase();

  if (name.includes('liv')) return 'liv';
  if (name.includes('lpga')) return 'lpga';
  if (name.includes('dp world') || name.includes('european') || name.includes('euro')) return 'euro';
  if (name.includes('champions') || name.includes('champ')) return 'champ';
  if (name.includes('korn ferry') || name.includes('pgad')) return 'pgad';
  if (name.includes('pga')) return 'pga';

  return 'pga';
}
