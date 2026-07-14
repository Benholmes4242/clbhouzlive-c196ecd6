/**
 * ComingUpSlot - adapter that mounts the v4 ComingUp section on the live
 * Overview with a per-section tour lens (local state, defaults to All Tours).
 *
 * All Tours (tourLens === null): ComingUp renders a single chronological
 * merged list across all tours (soonest first). A selected tour filters
 * to that tour only.
 */
import { useState } from 'react';
import { ComingUp } from '@/features/tourhub/overview/sections/ComingUp';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function ComingUpSlot() {
  const [tourLens, setTourLens] = useState<TourId | null>(null);
  return (
    <>
      <SectionTourLens value={tourLens} onChange={setTourLens} />
      <ComingUp tour={tourLens} />
    </>
  );
}

export default ComingUpSlot;
