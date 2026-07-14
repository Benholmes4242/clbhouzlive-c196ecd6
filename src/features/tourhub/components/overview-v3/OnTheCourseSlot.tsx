/**
 * OnTheCourseSlot — live-only adapter with a per-section tour lens.
 *
 * OnTheCourse is keyed by a single viewingTournamentId (the tournament the
 * hero is focused on). The lens filters that live rail to the selected tour;
 * All Tours mode keeps the current viewing tournament (single-id assumption)
 * and hides the section when the viewing tournament's tour does not match
 * the selected lens.
 */
import { useState } from 'react';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { OnTheCourse } from '@/features/tourhub/overview/sections/OnTheCourse';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import { useTournamentPulse } from './useTournamentPulse';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function OnTheCourseSlot() {
  const [tourLens, setTourLens] = useState<TourId | null>(null);
  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const tournamentId = viewingTournamentId ?? undefined;
  const { isLive } = useTournamentPulse(tournamentId);

  if (!tournamentId || !isLive) return null;

  const viewingTour = (viewingTourSlug ?? 'pga') as TourId;
  // When a tour is selected, only show if the viewing tournament belongs to it.
  if (tourLens !== null && tourLens !== viewingTour) {
    return <SectionTourLens value={tourLens} onChange={setTourLens} />;
  }
  const tourCode: TourId = tourLens ?? viewingTour;
  return (
    <>
      <SectionTourLens value={tourLens} onChange={setTourLens} />
      <OnTheCourse tournamentId={tournamentId} live={isLive} tourCode={tourCode} />
    </>
  );
}

export default OnTheCourseSlot;
