/**
 * OnTheCourseSlot — live-only adapter that binds the v4 OnTheCourse rail
 * to the live Overview page's VIEWING tournament (matches hero + TI).
 *
 * Liveness is delegated to useTournamentPulse (shared with TISlot).
 */
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { OnTheCourse } from '@/features/tourhub/overview/sections/OnTheCourse';
import { useTournamentPulse } from './useTournamentPulse';

export function OnTheCourseSlot() {
  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const tournamentId = viewingTournamentId ?? undefined;
  const { isLive } = useTournamentPulse(tournamentId);

  if (!tournamentId || !isLive) return null;
  return <OnTheCourse tournamentId={tournamentId} live={isLive} tourCode={viewingTourSlug ?? 'pga'} />;
}

export default OnTheCourseSlot;
