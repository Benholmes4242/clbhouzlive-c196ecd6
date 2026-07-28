/**
 * Scope-driven rail emptiness plumbing for Discover.
 *
 * A rail that resolves to nothing for the active scope renders NOTHING —
 * no header, no empty card, no spacing. It reports that fact upward via an
 * `onEmpty` callback so ExploreTabContent can show ONE consolidated empty
 * state when two or more rails have gone missing.
 *
 * Rails report; the page decides. No second set of queries.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type OnRailEmpty = (empty: boolean) => void;

/**
 * Worldwide and GB&I are never hidden — they carry the membership, so an
 * empty rail there is a bug worth surfacing rather than concealing.
 */
export function isHideableScope(region: string | null | undefined): boolean {
  return region != null && region !== 'uk-ireland';
}

/**
 * Fires `onEmpty` once per resolved-emptiness change. The callback is held
 * in a ref so an inline parent function cannot drive a re-render loop, and
 * the rail reports "not empty" on unmount so a stale hidden count cannot
 * outlive the rail.
 *
 * `empty` must already exclude the loading state — nothing hides while it
 * is still resolving.
 */
export function useReportRailEmpty(onEmpty: OnRailEmpty | undefined, empty: boolean): void {
  const ref = useRef(onEmpty);
  ref.current = onEmpty;

  useEffect(() => {
    ref.current?.(empty);
  }, [empty]);

  useEffect(
    () => () => {
      ref.current?.(false);
    },
    [],
  );
}

/**
 * Page-side counter. `reporter(key)` returns a stable callback per rail, so
 * passing it inline in JSX does not change identity between renders.
 */
export function useHiddenRailTracker() {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const cache = useRef(new Map<string, OnRailEmpty>());

  const reporter = useCallback((key: string): OnRailEmpty => {
    const existing = cache.current.get(key);
    if (existing) return existing;
    const fn: OnRailEmpty = (empty) => {
      setHidden((prev) => (prev[key] === empty ? prev : { ...prev, [key]: empty }));
    };
    cache.current.set(key, fn);
    return fn;
  }, []);

  const hiddenCount = Object.values(hidden).filter(Boolean).length;
  return { reporter, hiddenCount };
}
