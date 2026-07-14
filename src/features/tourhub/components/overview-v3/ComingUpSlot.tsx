/**
 * ComingUpSlot - adapter that mounts the v4 ComingUp section on the live
 * Overview with a per-section tour lens (local state, defaults to PGA).
 *
 * The "All Tours" pill is intentionally omitted here -- tour is always a
 * concrete TourId. ComingUp's merged all-tours path is unused from this
 * slot (the useComingUp null path remains in the hook, just unused here).
 */
import { useState } from 'react';
import { ComingUp } from '@/features/tourhub/overview/sections/ComingUp';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function ComingUpSlot() {
  const [tour, setTour] = useState<TourId>('pga');
  return (
    <>
      <SectionTourLens value={tour} onChange={(t) => t && setTour(t)} showAllTours={false} />
      <ComingUp tour={tour} />
    </>
  );
}

export default ComingUpSlot;
