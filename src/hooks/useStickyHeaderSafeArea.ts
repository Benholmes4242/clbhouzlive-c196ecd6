import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Returns refs and styling helpers for a sticky page header that needs to
 * respect the iOS safe area WITHOUT doubling it against the fixed CompactHeader.
 *
 * Pattern: a 1px sentinel sits at the very top of the page. While the sentinel
 * is in view (page is at scroll top), CompactHeader's safe-area padding handles
 * the inset, so the sticky header should NOT also pad. Once the sentinel scrolls
 * out of view, the sticky header takes over safe-area duty.
 *
 * Usage:
 *   const { sentinelRef, paddingTop } = useStickyHeaderSafeArea();
 *
 *   <>
 *     <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
 *     <header className="sticky top-0 z-30" style={{ paddingTop, transition: 'padding-top 200ms ease' }}>
 *       ...
 *     </header>
 *   </>
 */
export function useStickyHeaderSafeArea(): {
  sentinelRef: RefObject<HTMLDivElement>;
  paddingTop: string | number;
  isAtTop: boolean;
} {
  const [isAtTop, setIsAtTop] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsAtTop(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const paddingTop = isAtTop ? 0 : 'max(env(safe-area-inset-top, 0px), 47px)';

  return { sentinelRef, paddingTop, isAtTop };
}
