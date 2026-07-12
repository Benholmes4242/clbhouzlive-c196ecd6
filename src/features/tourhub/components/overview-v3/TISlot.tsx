/**
 * TISlot — adapter that mounts the v4 TIPicksCarousel on the live Overview,
 * keyed to viewingTournamentId (matches hero + On-the-Course rail).
 */
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { TIPicksCarousel } from '@/features/tourhub/overview-v4/sections/TIPicksCarousel';
import { useTournamentPulse } from './useTournamentPulse';

export function TISlot() {
  const { viewingTournamentId } = useTourSelection();
  const tournamentId = viewingTournamentId ?? undefined;
  const { state } = useTournamentPulse(tournamentId);

  return <TIPicksCarousel tournamentId={tournamentId} state={state} />;
}

export default TISlot;
