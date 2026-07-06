/**
 * useWatchAutoplay — single, engine-native activation policy for the Watch
 * surface (rails + grid). Replaces the old useRailAutoplay hook and every
 * DIY IntersectionObserver / local active-tile state that used to live in
 * individual watch components (LatestVideosRail, CarouselRow, etc.).
 *
 * One hook, one IntersectionObserver per surface. Mirrors the PROVEN feed
 * activation model (see CardFeed.tsx / LightCardFeed.tsx) so the whole app
 * feels consistent:
 *
 *   PLAY_IN   = 0.5   most-visible tile must clear this to become active
 *   PLAY_OUT  = 0.35  incumbent is held while it stays above this
 *   HYSTERESIS= 0.1   challenger must beat incumbent by this to steal
 *   SETTLE_MS = 80    debounce so mid-scroll churn doesn't flap playback
 *
 * Tile discovery: descendants of `railRef` carrying `data-watch-tile-index`.
 * Gates: page reveal (WatchRevealContext), document visibility, reduced-
 * motion. saveData / 2g / network policy is owned by the VideoEngine — do
 * NOT re-implement it here. Rail-in-view is implicit: an offscreen rail's
 * tiles simply won't intersect and no candidate will beat PLAY_IN.
 *
 * Works uniformly for HORIZONTAL rails and the VERTICAL Clips grid because
 * intersectionRatio measures overlap area either way.
 *
 * Landing autoplay ("Instagram Explore"): the IntersectionObserver fires
 * synchronously for elements already in the viewport, so as soon as the
 * page reveal flips true the most-visible tile per rail activates without
 * requiring the user to scroll.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useWatchRevealed } from '@/components/watch/WatchRevealContext';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

const PLAY_IN = 0.5;
const PLAY_OUT = 0.35;
const HYSTERESIS = 0.1;
const SETTLE_MS = 80;
// Max-wait ceiling: guarantees recompute runs even under continuous IO bursts
// (hydration churn on masonry/full-feed grids can otherwise starve the trailing
// debounce indefinitely, leaving landing activation stuck at null until scroll).
const MAX_SETTLE_MS = 250;

const IO_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

export interface UseWatchAutoplayOptions {
  /** Diagnostic tag ("trending-this-week", "watch-grid", …). */
  railId: string;
  /** Master gate. Defaults to true. */
  enabled?: boolean;
}

export interface UseWatchAutoplayResult {
  /** Winning tile index, or null when no tile clears PLAY_IN or a gate is closed. */
  activeIdx: number | null;
  /**
   * Callback ref — attach to the rail/grid container that holds
   * `[data-watch-tile-index]` tiles. Owning the element in state guarantees
   * the effect re-arms deterministically when the container mounts late
   * (e.g. after loading skeletons unmount), instead of relying on `eligible`
   * transitions to force a re-run (which subpages without WatchRevealProvider
   * never get — the root cause of the subpage-autoplay hole).
   */
  railRef: (el: HTMLElement | null) => void;
}

/**
 * Owns the intersection observer + activation policy for a Watch rail/grid.
 * Attach the returned `railRef` to the tile container.
 */
export function useWatchAutoplay(
  { railId: _railId, enabled = true }: UseWatchAutoplayOptions,
): UseWatchAutoplayResult {
  const revealed = useWatchRevealed();
  const reducedMotion = usePrefersReducedMotion();
  const [docVisible, setDocVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden,
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);

  const railRef = useCallback((el: HTMLElement | null) => {
    setRoot(el);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => setDocVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Stage-7 PR-1: suspend activation while the fullscreen viewer is open so
  // rail tiles scrolling under the overlay cannot acquire lanes and evict a
  // pinned borrow (or otherwise churn the pool).
  const fsOpen = useFullscreenFeedStore((s) => s.isOpen);
  const eligible = enabled && revealed && !reducedMotion && docVisible && !fsOpen;

  const ratiosRef = useRef<Map<number, number>>(new Map());
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!eligible) {
      setActiveIdx(null);
      ratiosRef.current.clear();
      return;
    }
    if (!root) return;

    const recompute = () => {
      let bestIdx = -1;
      let bestRatio = 0;
      ratiosRef.current.forEach((ratio, idx) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIdx = idx;
        }
      });

      setActiveIdx((prev) => {
        const prevRatio = prev != null ? (ratiosRef.current.get(prev) ?? 0) : 0;
        // Keep incumbent while still >= PLAY_OUT and nobody clearly beats it.
        if (prev != null && prevRatio >= PLAY_OUT && bestRatio - prevRatio < HYSTERESIS) {
          return prev;
        }
        // Promote a challenger that has cleared PLAY_IN.
        if (bestIdx >= 0 && bestRatio >= PLAY_IN) return bestIdx;
        // Between-tiles: hold the incumbent if it's still barely visible.
        if (prev != null && prevRatio >= PLAY_OUT) return prev;
        // Cold start / everyone dropped out: pick the most-visible if it
        // clears PLAY_OUT — otherwise release the slot.
        if (bestIdx >= 0 && bestRatio >= PLAY_OUT) return bestIdx;
        return null;
      });
    };

    const runRecompute = () => {
      if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
      if (maxWaitTimer.current) { clearTimeout(maxWaitTimer.current); maxWaitTimer.current = null; }
      recompute();
    };

    const scheduleRecompute = () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(runRecompute, SETTLE_MS);
      // Max-wait ceiling: even if bursts keep resetting the trailing timer,
      // force a recompute so landing activation lands during hydration churn.
      if (!maxWaitTimer.current) {
        maxWaitTimer.current = setTimeout(runRecompute, MAX_SETTLE_MS);
      }
    };

    const observeTiles = (tiles: NodeListOf<HTMLElement> | HTMLElement[]) => {
      tiles.forEach((t) => io.observe(t));
    };

    const io = new IntersectionObserver(
      (entries) => {
        let touched = false;
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const raw = el.dataset.watchTileIndex;
          if (raw == null) continue;
          const idx = Number(raw);
          if (Number.isNaN(idx)) continue;
          if (entry.isIntersecting) {
            ratiosRef.current.set(idx, entry.intersectionRatio);
          } else {
            ratiosRef.current.delete(idx);
          }
          touched = true;
        }
        if (touched) scheduleRecompute();
      },
      { threshold: IO_THRESHOLDS },
    );

    const initial = root.querySelectorAll<HTMLElement>('[data-watch-tile-index]');
    observeTiles(initial);
    // Kick a recompute after initial observe so IO's async first-batch delivery
    // has a pending compute even if hydration bursts start immediately.
    scheduleRecompute();

    // Re-scan on DOM mutations (feeds paginate / rails hydrate late).
    const mo = new MutationObserver(() => {
      const next = root.querySelectorAll<HTMLElement>('[data-watch-tile-index]');
      observeTiles(next);
      scheduleRecompute();
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
      if (maxWaitTimer.current) { clearTimeout(maxWaitTimer.current); maxWaitTimer.current = null; }
      ratiosRef.current.clear();
    };
  }, [eligible, root]);

  return { activeIdx: eligible ? activeIdx : null, railRef };

}

export default useWatchAutoplay;
