/**
 * WorldRankingsSlot — adapter that mounts the v4 WorldRankings section on
 * the live Overview, keyed to viewingTourSlug. Section self-hides on
 * unsupported tours (liv/pgad/champ) or empty data.
 */
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { WorldRankings } from '@/features/tourhub/overview/sections/WorldRankings';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function WorldRankingsSlot() {
  const { viewingTourSlug } = useTourSelection();
  const tour = (viewingTourSlug ?? 'pga') as TourId;
  return <WorldRankings tour={tour} />;
}

export default WorldRankingsSlot;
