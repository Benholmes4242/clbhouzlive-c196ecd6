/**
 * WorldRankingsSlot — mounts the v4 WorldRankings section on the live
 * Overview driven by the global Tour Hub lens. All Tours resolves to the OWGR,
 * the app's genuine world list. Unsupported boards hide rather than substitute.
 */
import { WorldRankings } from '@/features/tourhub/overview/sections/WorldRankings';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const RANKING_TOURS = new Set<string>(['pga', 'lpga', 'euro', 'liv', 'pgad']);

export function WorldRankingsSlot() {
  const { selectedTourSlug } = useTourSelection();
  const active = selectedTourSlug ?? 'all';
  if (active === 'all') return <WorldRankings tour="pga" />;
  if (!RANKING_TOURS.has(active)) return null;
  return <WorldRankings tour={active as TourId} />;
}

export default WorldRankingsSlot;
