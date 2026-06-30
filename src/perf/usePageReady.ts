import { useEffect, useLayoutEffect } from 'react';
import {
  isPerfEnabled,
  markContentPainted,
  markDataSettled,
  markSkeletonShown,
  markSkeletonExempt,
  notePageRootMount,
} from './navTiming';

/**
 * Call from a page when its render-gating data is ready.
 * Passing `ready=false` does nothing; `ready=true` marks data-settled once.
 * Then schedules a double-rAF to mark content-painted.
 */
export function usePageReady(ready: boolean) {
  useEffect(() => {
    if (!isPerfEnabled() || !ready) return;
    markDataSettled();
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => markContentPainted());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [ready]);
}

/** Page-root mount counter for doubleMount detection. */
export function usePageRootMount() {
  useLayoutEffect(() => {
    if (!isPerfEnabled()) return;
    notePageRootMount();
  }, []);
}

/** Skeleton components call this in a useLayoutEffect. */
export function useSkeletonShown() {
  useLayoutEffect(() => {
    if (!isPerfEnabled()) return;
    markSkeletonShown();
  }, []);
}

/** Page declares it intentionally has no skeleton (neutral hold is by design). */
export function usePageSkeletonExempt() {
  useLayoutEffect(() => {
    if (!isPerfEnabled()) return;
    markSkeletonExempt();
  }, []);
}
