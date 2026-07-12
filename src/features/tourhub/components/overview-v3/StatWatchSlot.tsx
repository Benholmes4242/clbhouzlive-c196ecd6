/**
 * StatWatchSlot — adapter that mounts the v4 StatWatch section on the
 * live Overview, keyed to viewingTourSlug. Section self-hides when the
 * requested tour has no sr_player_statistics coverage (currently non-PGA).
 */
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { StatWatch } from '@/features/tourhub/overview-v4/sections/StatWatch';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function StatWatchSlot() {
  const { viewingTourSlug } = useTourSelection();
  const tour = (viewingTourSlug ?? 'pga') as TourId;
  return <StatWatch tour={tour} />;
}

export default StatWatchSlot;
