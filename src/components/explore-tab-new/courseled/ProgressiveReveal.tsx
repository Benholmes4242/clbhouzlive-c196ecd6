import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * PROGRESSIVE REVEAL (BRIEF_DISCOVER_ONE_PAGE §3.4).
 *
 * WITH /community DELETED THERE IS NO DESTINATION, so a cap with no way past it
 * hides content PERMANENTLY. Every media section on Discover therefore grows in
 * place.
 *
 * IT IS THE PHOTO MOSAIC'S MECHANISM, NOT A SECOND ONE: the pool is already in
 * memory, so a sentinel 600px below the fold only governs how many items are
 * MOUNTED. CommunityPhotoMosaic owns that behaviour internally (it must, because
 * it fills two columns by index); this wrapper lends it to the sections that do
 * not, without editing them.
 *
 * A NEW POOL RESETS THE COUNT — a chip must not inherit a scrolled-deep reveal.
 */
export function ProgressiveReveal<T>({
  items,
  step,
  initial,
  children,
}: {
  items: T[];
  /** Items added per reveal. */
  step: number;
  /** Items mounted on first paint. Defaults to one step. */
  initial?: number;
  children: (visible: T[]) => React.ReactNode;
}) {
  const first = initial ?? step;
  const [shown, setShown] = useState(first);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => setShown(first), [items, first]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= items.length) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown((n) => Math.min(n + step, items.length));
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, items.length, step]);

  const visible = useMemo(() => items.slice(0, shown), [items, shown]);

  return (
    <>
      {children(visible)}
      <div ref={sentinel} aria-hidden style={{ height: 1 }} />
    </>
  );
}

export default ProgressiveReveal;
