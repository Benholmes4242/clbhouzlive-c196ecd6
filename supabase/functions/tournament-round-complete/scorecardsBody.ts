import { getTourSlug } from '../_shared/tourSlug.ts';
/** Body for the one-round scorecard pull: sportradar-sync reads roundNumber and tourId. */
export function scorecardsInvokeBody(srId: string, roundNumber: number, year: number, tourName: string | null | undefined) {
  const tourId = getTourSlug(tourName || 'pga');
  return { action: 'scorecards', tournamentId: srId, roundNumber, ...(tourId ? { tourId } : {}), year };
}
