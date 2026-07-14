/**
 * TISlot — tournament-scoped picks carousel. Follows the featured
 * viewingTournamentId unconditionally. No tour lens: TI is per-tournament,
 * not per-tour.
 */
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { TIPicksCarousel } from '@/features/tourhub/overview/sections/TIPicksCarousel';
import { useTournamentPulse } from './useTournamentPulse';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function TISlot() {
  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const tournamentId = viewingTournamentId ?? undefined;
  const { state } = useTournamentPulse(tournamentId);

  const tourCode = (viewingTourSlug ?? 'pga') as TourId;
  return <TIPicksCarousel tournamentId={tournamentId} state={state} tourCode={tourCode} />;
}

export default TISlot;
