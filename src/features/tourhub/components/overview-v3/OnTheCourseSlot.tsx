/**
 * OnTheCourseSlot — tournament-scoped live rail. Follows the featured
 * live tournament (viewingTournamentId) unconditionally. No tour lens:
 * this section is per-tournament, not per-tour.
 */
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { OnTheCourse } from '@/features/tourhub/overview/sections/OnTheCourse';
import { useTournamentPulse } from './useTournamentPulse';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function OnTheCourseSlot() {
  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const tournamentId = viewingTournamentId ?? undefined;
  const { isLive } = useTournamentPulse(tournamentId);

  if (!tournamentId || !isLive) return null;

  const tourCode = (viewingTourSlug ?? 'pga') as TourId;
  return <OnTheCourse tournamentId={tournamentId} live={isLive} tourCode={tourCode} />;
}

export default OnTheCourseSlot;
