/**
 * StatWatchSlot — mounts the v4 StatWatch section on the live Overview
 * with a per-section tour lens.
 *
 * All Tours (tourLens === null): renders StatWatch per tour stacked in the
 * canonical order; each instance self-hides when its tour has no
 * sr_player_statistics coverage (currently only PGA has coverage).
 */
import { useState } from 'react';
import { StatWatch } from '@/features/tourhub/overview/sections/StatWatch';
import { SectionTourLens } from '@/features/tourhub/overview/sections/SectionTourLens';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const TOUR_ORDER: TourId[] = ['pga', 'lpga', 'euro', 'liv', 'champ', 'pgad'];

export function StatWatchSlot() {
  const [tourLens, setTourLens] = useState<TourId | null>(null);
  return (
    <>
      <SectionTourLens value={tourLens} onChange={setTourLens} />
      {tourLens === null
        ? TOUR_ORDER.map((t) => <StatWatch key={t} tour={t} />)
        : <StatWatch tour={tourLens} />}
    </>
  );
}

export default StatWatchSlot;
