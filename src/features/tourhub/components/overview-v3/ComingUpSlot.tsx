/**
 * ComingUpSlot - adapter that mounts the v4 ComingUp section on the live
 * Overview with a per-section tour lens (local state, defaults to All Tours).
 *
 * All Tours (tourLens === null): renders ComingUp per tour stacked in the
 * canonical order; each ComingUp instance self-hides on empty. The per-row
 * tour tag is emitted by the underlying section rows unchanged.
 */
import { useState } from 'react';
import { ComingUp } from '@/features/tourhub/overview/sections/ComingUp';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const TOUR_ORDER: TourId[] = ['pga', 'lpga', 'euro', 'liv', 'champ', 'pgad'];

export function ComingUpSlot() {
  const [tourLens, setTourLens] = useState<TourId | null>(null);
  return (
    <>
      <SectionTourLens value={tourLens} onChange={setTourLens} />
      {tourLens === null
        ? TOUR_ORDER.map((t) => <ComingUp key={t} tour={t} />)
        : <ComingUp tour={tourLens} />}
    </>
  );
}

export default ComingUpSlot;
