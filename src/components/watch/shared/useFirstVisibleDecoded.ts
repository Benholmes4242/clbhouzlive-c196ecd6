import { useCallback, useRef, useState } from 'react';

/**
 * Reveal-gating helper: returns `settled` = true once `onDecoded` has fired
 * at least `min(visibleCount, itemCount)` times. Empty (`itemCount === 0`)
 * is settled immediately — nothing to paint.
 *
 * Wire the returned `onDecoded` to the first `visibleCount` tiles only so
 * off-screen tiles don't gate the reveal.
 */
export function useFirstVisibleDecoded(itemCount: number, visibleCount: number) {
  const [settled, setSettled] = useState(false);
  const countRef = useRef(0);
  const doneRef = useRef(false);

  // Reset when the item set changes materially. We deliberately do NOT reset
  // when itemCount only grows past `visibleCount`.
  const target = Math.min(visibleCount, itemCount);

  const onDecoded = useCallback(() => {
    if (doneRef.current) return;
    countRef.current += 1;
    if (countRef.current >= target && target > 0) {
      doneRef.current = true;
      setSettled(true);
    }
  }, [target]);

  const effectiveSettled = itemCount === 0 ? true : settled;
  return { settled: effectiveSettled, onDecoded };
}
