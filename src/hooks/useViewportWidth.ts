import { useEffect, useState } from 'react';

/**
 * Lightweight viewport-width hook used for responsive Frost Panel surfaces
 * (InlineReviewCard, ReviewBottomSheet, review skeleton).
 *
 * Returns `window.innerWidth`, kept in sync via the `resize` event.
 * SSR-safe — defaults to 430 (iPhone Pro Max) when window is unavailable.
 */
export function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 430 : window.innerWidth,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}

/** Compact viewport breakpoint — anything narrower than 360px (iPhone SE territory). */
export const COMPACT_VIEWPORT_MAX = 360;
