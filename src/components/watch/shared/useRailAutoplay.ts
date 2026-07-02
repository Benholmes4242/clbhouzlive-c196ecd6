import { useEffect, useRef, useState, type RefObject } from 'react';
import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion';
import { useWatchRevealed } from '../WatchRevealContext';

/**
 * useRailAutoplay
 * ---------------
 * Owns "which tile index in this rail holds the play slot" — at most one.
 * The active tile is the one with the highest intersectionRatio ≥ 0.5, with
 * hysteresis (challenger must beat the incumbent by ≥ 0.15) so lateral
 * scrolling doesn't flap playback.
 *
 * Gates (all-required for a non-null slot):
 *   - Page reveal has fired (`useWatchRevealed`).
 *   - prefers-reduced-motion is NOT set.
 *   - The device is NOT on 2g / slow-2g / saveData.
 *   - Rail itself is ≥25% in view.
 *   - Document is visible (visibilitychange -> pause all).
 *
 * Tiles are discovered via `data-rail-tile-index` on descendants of `railRef`.
 */

const RATIO_ENTER = 0.5;
const HYSTERESIS = 0.15;
const RAIL_MIN_VISIBLE = 0.25;

function isSlowNetwork(): boolean {
  if (typeof navigator === 'undefined') return false;
  const c: any = (navigator as any).connection;
  if (!c) return false;
  const type = c.effectiveType;
  if (type === '2g' || type === 'slow-2g') return true;
  if (c.saveData) return true;
  return false;
}

export function useRailAutoplay(
  railRef: RefObject<HTMLElement>,
  tileCount: number,
): number | null {
  const pageRevealed = useWatchRevealed();
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeIndexRef = useRef<number | null>(null);
  const ratiosRef = useRef<Map<number, number>>(new Map());
  const railInViewRef = useRef(false);
  const [docVisible, setDocVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden,
  );

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Document visibility → pause all when hidden.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => setDocVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const eligible =
    pageRevealed && !reducedMotion && docVisible && !isSlowNetwork();

  useEffect(() => {
    if (!eligible) {
      setActiveIndex(null);
      return;
    }
    const rail = railRef.current;
    if (!rail || tileCount === 0) return;

    const recompute = () => {
      if (!railInViewRef.current) {
        if (activeIndexRef.current !== null) setActiveIndex(null);
        return;
      }
      const ratios = ratiosRef.current;
      let bestIdx: number | null = null;
      let bestRatio = 0;
      for (const [idx, r] of ratios) {
        if (r >= RATIO_ENTER && r > bestRatio) {
          bestRatio = r;
          bestIdx = idx;
        }
      }
      const current = activeIndexRef.current;
      if (bestIdx === null) {
        // No candidate above threshold — if the incumbent has fallen below
        // ENTER, release; otherwise keep it (cheap resume).
        if (current !== null) {
          const currentRatio = ratios.get(current) ?? 0;
          if (currentRatio < RATIO_ENTER) setActiveIndex(null);
        }
        return;
      }
      if (current === null || current === bestIdx) {
        if (current !== bestIdx) setActiveIndex(bestIdx);
        return;
      }
      // Hysteresis: only steal if challenger beats incumbent by ≥ HYSTERESIS.
      const currentRatio = ratios.get(current) ?? 0;
      if (bestRatio - currentRatio >= HYSTERESIS) setActiveIndex(bestIdx);
    };

    const tileIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const raw = el.dataset.railTileIndex;
          if (raw == null) continue;
          const idx = Number(raw);
          if (Number.isNaN(idx)) continue;
          ratiosRef.current.set(idx, entry.intersectionRatio);
        }
        recompute();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    const railIO = new IntersectionObserver(
      ([entry]) => {
        railInViewRef.current = entry.intersectionRatio >= RAIL_MIN_VISIBLE;
        recompute();
      },
      { threshold: [0, RAIL_MIN_VISIBLE, 0.5, 1] },
    );
    railIO.observe(rail);

    // Discover tiles (they are children with data-rail-tile-index).
    const tiles = rail.querySelectorAll<HTMLElement>('[data-rail-tile-index]');
    tiles.forEach((t) => tileIO.observe(t));

    // Re-scan on DOM changes (post lists render async).
    const mo = new MutationObserver(() => {
      const next = rail.querySelectorAll<HTMLElement>('[data-rail-tile-index]');
      next.forEach((t) => tileIO.observe(t));
    });
    mo.observe(rail, { childList: true, subtree: true });

    return () => {
      tileIO.disconnect();
      railIO.disconnect();
      mo.disconnect();
      ratiosRef.current.clear();
      railInViewRef.current = false;
    };
  }, [eligible, tileCount, railRef]);

  return eligible ? activeIndex : null;
}

export default useRailAutoplay;
