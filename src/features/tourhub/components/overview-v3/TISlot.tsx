/**
 * TISlot — mounts TIPicksCarousel on the live Overview with a per-section
 * tour lens.
 *
 * TI is inherently per-tournament (keyed by viewingTournamentId). All Tours
 * shows picks for the current viewing tournament (the chronologically
 * featured one across all tours). Selecting a specific tour filters to that
 * tour only, and if the viewing tournament is not on that tour the lens
 * remains rendered but the carousel hides.
 */
import { useState } from 'react';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { TIPicksCarousel } from '@/features/tourhub/overview/sections/TIPicksCarousel';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import { useTournamentPulse } from './useTournamentPulse';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function TISlot() {
  const [tourLens, setTourLens] = useState<TourId | null>(null);
  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const tournamentId = viewingTournamentId ?? undefined;
  const { state } = useTournamentPulse(tournamentId);

  const viewingTour = (viewingTourSlug ?? 'pga') as TourId;
  if (tourLens !== null && tourLens !== viewingTour) {
    return <SectionTourLens value={tourLens} onChange={setTourLens} />;
  }
  const tourCode: TourId = tourLens ?? viewingTour;
  return (
    <>
      <SectionTourLens value={tourLens} onChange={setTourLens} />
      <TIPicksCarousel tournamentId={tournamentId} state={state} tourCode={tourCode} />
    </>
  );
}

export default TISlot;
