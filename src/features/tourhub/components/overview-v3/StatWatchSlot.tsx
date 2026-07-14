/**
 * StatWatchSlot — mounts the v4 StatWatch section on the live Overview.
 *
 * Fixed to PGA: SG stats coverage is PGA-only, so the lens is removed and
 * this slot renders a single PGA instance. Self-hides when PGA has no data.
 */
import { StatWatch } from '@/features/tourhub/overview/sections/StatWatch';

export function StatWatchSlot() {
  return <StatWatch tour="pga" />;
}

export default StatWatchSlot;
