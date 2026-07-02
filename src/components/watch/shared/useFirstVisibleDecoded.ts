import { useCallback, useRef, useState } from 'react';

/**
 * Reveal-gating helper: returns `settled` = true once `onDecoded` has fired
 * at least `min(visibleCount, itemCount)` times.
 *
 * IMPORTANT: when `itemCount === 0` we return `settled = false` — an empty
 * list is NOT vacuously settled. Callers must combine this hook with a
 * `hasResolved` signal (e.g. `query.dataUpdatedAt > 0`) so the reveal only
 * fires once the fetch has actually completed. This prevents the
 * "threshold-0 race" where a rail settles at 0ms before its query even
 * starts.
 */
export function useFirstVisibleDecoded(itemCount: number, visibleCount: number) {
  const [settled, setSettled] = useState(false);
  const countRef = useRef(0);
  const doneRef = useRef(false);

  const target = Math.min(visibleCount, itemCount);

  const onDecoded = useCallback(() => {
    if (doneRef.current) return;
    countRef.current += 1;
    if (target > 0 && countRef.current >= target) {
      doneRef.current = true;
      setSettled(true);
    }
  }, [target]);

  // 0 items -> NOT settled. Caller layers `hasResolved && (isEmpty || settled)`.
  const effectiveSettled = target > 0 && settled;
  return { settled: effectiveSettled, onDecoded };
}
