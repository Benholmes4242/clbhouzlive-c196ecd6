/**
 * useMergedBatch — the merge half of the batch idiom documented in
 * `src/lib/queryKeys.ts`.
 *
 * A batched "one read per visible page" query keys on a stable scope plus a
 * monotonic loaded-count (`batchKey`). When the count moves, the key moves and
 * react-query fetches; `placeholderData: keepPreviousData` keeps the previous
 * map on screen meanwhile, and this helper merges the new result OVER that
 * previous map inside `queryFn` so a row that already had data can never
 * regress to having none.
 *
 * Values are therefore monotonic: rows get added, existing rows get refreshed,
 * nothing disappears mid-scroll. That is the property the old id-hashed keys
 * lacked — they replaced the whole map, so every rendered row unmounted for a
 * paint on every pagination page.
 */
import { useCallback, useRef } from 'react';

export interface MergedBatch<V> {
  /** Call inside `queryFn`: merges the freshly fetched map over the last one. */
  mergeOverPrevious: (next: Map<string, V>) => Map<string, V>;
  /** Call during render with the query's current data to track the latest map. */
  commit: (data: Map<string, V> | undefined) => void;
}

export function useMergedBatch<V>(): MergedBatch<V> {
  const previousRef = useRef<Map<string, V>>(new Map());

  const mergeOverPrevious = useCallback((next: Map<string, V>) => {
    const merged = new Map(previousRef.current);
    next.forEach((value, key) => merged.set(key, value));
    return merged;
  }, []);

  const commit = useCallback((data: Map<string, V> | undefined) => {
    if (data && data !== previousRef.current) previousRef.current = data;
  }, []);

  return { mergeOverPrevious, commit };
}
