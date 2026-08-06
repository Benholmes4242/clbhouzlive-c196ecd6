import { useEffect } from 'react';

import { reportDiscoverNewCount, type DiscoverNewSection } from '@/stores/discoverNewStore';

/**
 * NEW-SINCE comparison helpers (BRIEF_DISCOVER_NEW_SINCE, section 2).
 *
 * ZERO new queries: every timestamp used here is already on the data each
 * section fetches. This is comparison, not fetching.
 */

/** Accepts an ISO timestamp or a date-only string (play dates). */
export function tsOf(at: string | null | undefined): number | null {
  if (!at) return null;
  const iso = at.length <= 10 ? `${at}T12:00:00` : at;
  const n = new Date(iso).getTime();
  return Number.isFinite(n) ? n : null;
}

export function isNewSince(at: string | null | undefined, lastSeen: number | null): boolean {
  if (!lastSeen) return false;
  const n = tsOf(at);
  return n != null && n > lastSeen;
}

export function countNewSince<T>(
  items: readonly T[],
  at: (item: T) => string | null | undefined,
  lastSeen: number | null,
): number {
  if (!lastSeen) return 0;
  let n = 0;
  for (const item of items) if (isNewSince(at(item), lastSeen)) n += 1;
  return n;
}

/** Publishes a section's new-item count for the tab badge. */
export function useReportNewCount(section: DiscoverNewSection, count: number): void {
  useEffect(() => {
    reportDiscoverNewCount(section, count);
  }, [section, count]);
}
