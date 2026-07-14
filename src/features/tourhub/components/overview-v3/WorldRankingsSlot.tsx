/**
 * WorldRankingsSlot — mounts the v4 WorldRankings section on the live
 * Overview with a per-section tour lens (defaults to PGA, no All Tours).
 */
import { useState } from 'react';
import { WorldRankings } from '@/features/tourhub/overview/sections/WorldRankings';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function WorldRankingsSlot() {
  const [tour, setTour] = useState<TourId>('pga');
  return (
    <>
      <SectionTourLens value={tour} onChange={(t) => t && setTour(t)} showAllTours={false} />
      <WorldRankings tour={tour} />
    </>
  );
}

export default WorldRankingsSlot;
