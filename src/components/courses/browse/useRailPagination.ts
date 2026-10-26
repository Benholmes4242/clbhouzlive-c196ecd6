import { useEffect, useRef } from 'react';

/** Rail-local observation keeps vertical page scrolling out of pagination.
 * Re-arm after each page, including duplicate-only pages whose card count stays unchanged.
 * A synchronous latch prevents repeated observer callbacks from starting the same page twice.
 */
export function useRailPagination({ hasNextPage, isFetching, fetchNextPage, cardWidth, pageCount, visible, blocked = false, isBlocked }: {
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: () => Promise<unknown>;
  cardWidth: number;
  pageCount: number;
  visible: boolean;
  blocked?: boolean;
  isBlocked?: () => boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = railRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !visible || !hasNextPage || isFetching || blocked || typeof IntersectionObserver === 'undefined') return;
    let requested = false;
    const observer = new IntersectionObserver(entries => {
      if (requested || isBlocked?.() || !entries.some(entry => entry.isIntersecting)) return;
      requested = true;
      void fetchNextPage();
    }, { root, rootMargin: `0px ${cardWidth * 2}px 0px 0px`, threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage, cardWidth, pageCount, visible, blocked, isBlocked]);
  return { railRef, sentinelRef };
}

/** Preserve first occurrence and server order when a live item moves between pages. */
export function dedupeRailRows<T>(pages: readonly T[][], key: (row: T) => string): T[] {
  const seen = new Set<string>();
  return pages.flat().filter(row => {
    const id = key(row);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}