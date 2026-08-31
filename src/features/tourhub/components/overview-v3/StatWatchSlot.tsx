/**
 * StatWatchSlot — mounts the v4 StatWatch section on the live Overview.
 *
 * Driven by the GLOBAL tour chip (TourSelectionContext) like every other
 * section on the page. SG stats coverage is PGA-only, so any tour without a
 * stats board (LIV, Korn Ferry, Champions, the 'major' pseudo-tour, or All
 * Tours) is hidden rather than silently presenting PGA data under another lens.
 */
import { StatWatch } from '@/features/tourhub/overview/sections/StatWatch';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const STATS_TOURS = new Set<string>(['pga', 'lpga', 'euro']);

export function StatWatchSlot() {
  const { selectedTourSlug } = useTourSelection();
  const active = selectedTourSlug ?? 'all';
  if (!STATS_TOURS.has(active)) return null;
  return <StatWatch tour={active as TourId} />;
}

export default StatWatchSlot;
