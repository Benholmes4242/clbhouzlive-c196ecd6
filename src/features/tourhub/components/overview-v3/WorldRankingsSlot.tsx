/**
 * WorldRankingsSlot — mounts the v4 WorldRankings section on the live
 * Overview with a per-section tour lens.
 *
 * All Tours (tourLens === null): renders the global OWGR list (tour-agnostic
 * data). We pass 'pga' as the section already returns the raw OWGR set at
 * that key; a selected tour filters to that tour's ranked players via the
 * section's existing per-tour filter.
 */
import { useState } from 'react';
import { WorldRankings } from '@/features/tourhub/overview/sections/WorldRankings';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function WorldRankingsSlot() {
  const [tourLens, setTourLens] = useState<TourId | null>(null);
  const tour: TourId = tourLens ?? 'pga';
  return (
    <>
      <SectionTourLens value={tourLens} onChange={setTourLens} />
      <WorldRankings tour={tour} />
    </>
  );
}

export default WorldRankingsSlot;
