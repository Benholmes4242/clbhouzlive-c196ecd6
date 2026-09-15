/** First rail follows three cards; every later slot follows four more. */
export function shelfDueAt(ordinal: number): number {
  return 3 + ordinal * 4;
}

/**
 * Resolve a scheduled rail without moving later rails into an empty rail's
 * slot. Repeating surfaces wrap; finite surfaces stop after one pass.
 */
export function shelfForOrdinal<T>(shelves: readonly T[], ordinal: number, repeat: boolean): T | null {
  if (shelves.length === 0) return null;
  if (!repeat && ordinal >= shelves.length) return null;
  return shelves[ordinal % shelves.length] ?? null;
}
