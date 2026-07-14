/**
 * StatWatchSlot — mounts the v4 StatWatch section fixed to PGA.
 *
 * No lens: StatWatch coverage is PGA-only (sr_player_statistics has no SG
 * data for other tours). The section self-hides if PGA data is empty.
 */
import { StatWatch } from '@/features/tourhub/overview/sections/StatWatch';

export function StatWatchSlot() {
  return <StatWatch tour="pga" />;
}

export default StatWatchSlot;
