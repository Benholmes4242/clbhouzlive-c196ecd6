/**
 * StatWatchSlot — mounts the v4 StatWatch section on the live Overview.
 *
 * Driven by the GLOBAL tour chip (TourSelectionContext) like every other
 * section on the page. SG stats coverage is PGA-only, so any tour without a
 * stats board (LIV, Korn Ferry, Champions, the 'major' pseudo-tour, "All
 * tours") falls back to PGA; StatWatch itself self-hides on no data.
 */
import { StatWatch } from '@/features/tourhub/overview/sections/StatWatch';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const STATS_TOURS = new Set<string>(['pga', 'lpga', 'euro']);

export function StatWatchSlot() {
  const { selectedTourSlug, viewingTourSlug } = useTourSelection();
  const active = viewingTourSlug ?? selectedTourSlug ?? 'pga';
  const tour = (STATS_TOURS.has(active) ? active : 'pga') as TourId;
  return <StatWatch tour={tour} />;
}

export default StatWatchSlot;
