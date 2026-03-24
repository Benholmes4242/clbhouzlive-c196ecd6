// TODO: add hcp_movement_30d to get_lowest_handicap_leaderboard RPC to enable Recent Movers strip
// This component is a placeholder — it will render nothing until movement data is available.

import type { LowestHandicapEntry } from '@/types/leaderboards';

interface HandicapMoverStripProps {
  entries: LowestHandicapEntry[];
  currentUserId?: string;
}

/**
 * Recent Movers — horizontal strip showing users whose handicap changed ≥ 0.5 in the last 30 days.
 * Currently disabled: the get_lowest_handicap_leaderboard RPC does not return movement data.
 */
export function HandicapMoverStrip(_props: HandicapMoverStripProps) {
  // TODO: add hcp_movement_30d to get_lowest_handicap_leaderboard RPC to enable Recent Movers strip
  return null;
}
