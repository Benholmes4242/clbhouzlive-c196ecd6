import type { FriendRivalryHydrated } from '@/lib/whs/types';

/**
 * Returns the lowest unused slot_index across all current rivalries.
 * Slots are 0-indexed; user-facing copy never exposes the number.
 */
export function nextAvailableSlot(rivalries: FriendRivalryHydrated[]): number {
  const used = new Set(rivalries.map((r) => r.slot_index));
  let i = 0;
  while (used.has(i)) i++;
  return i;
}
