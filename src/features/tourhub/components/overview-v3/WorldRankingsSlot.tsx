/**
 * WorldRankingsSlot — mounts the v4 WorldRankings section on the live
 * Overview with a per-section tour lens.
 *
 * No "All Tours" pill: default PGA, chips filter to a specific tour.
 */
import { useState } from 'react';
import { WorldRankings } from '@/features/tourhub/overview/sections/WorldRankings';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function WorldRankingsSlot() {
  const [tour, setTour] = useState<TourId>('pga');
  return (
    <>
      {/* Champions is the ONE tour with no row in tour_season_rankings. liv and
          pgad DO have boards — keep this array in step with TOUR_TO_BOARD in
          WorldRankings.tsx. */}
      <SectionTourLens value={tour} onChange={setTour} showAllTours={false} excludeTours={['champ']} />
      <WorldRankings tour={tour} />
    </>
  );
}

export default WorldRankingsSlot;
