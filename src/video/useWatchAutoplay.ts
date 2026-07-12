/**
 * useWatchAutoplay — single, engine-native activation policy for the Watch
 * surface (rails + grid). Replaces the old useRailAutoplay hook and every
 * DIY IntersectionObserver / local active-tile state that used to live in
 * individual watch components that used their own observers.
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
import { useWatchRevealed } from './WatchRevealContext';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { PrefetchController } from './PrefetchController';
import type { FeedPost } from '@/components/media-system/types/media';

// PLAY_IN/OUT match CardFeed's early-activation stance (CardFeed.tsx:236-237)
// so watch tiles begin muted playback AS they enter the viewport, not once
// they're past the centre — kills the "playing when half in-view" lag while
// respecting the existing single-active-per-rail rule (an early promotion
// simply replaces the incumbent).
const PLAY_IN = 0.30;
const PLAY_OUT = 0.20;
const HYSTERESIS = 0.1;
const SETTLE_MS = 80;
// Max-wait ceiling: guarantees recompute runs even under continuous IO bursts
// (hydration churn on masonry/full-feed grids can otherwise starve the trailing
// debounce indefinitely, leaving landing activation stuck at null until scroll).
const MAX_SETTLE_MS = 250;

// Approach-warming coverage: every visible tile gets its manifest+first
// segment warmed via PrefetchController (idempotent, LRU-deduped, capped
// 2 in-flight, saveData/2g skips). Widened to cover fully-visible tiles
// too so cold fullscreen opens on tiles that never won activation still
// hit the browser HTTP cache instead of a cold HLS attach.
const APPROACH_MIN = 0.02;

const IO_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

export interface UseWatchAutoplayOptions {
  /** Diagnostic tag ("trending-this-week", "watch-grid", …). */
  railId: string;
  /** Master gate. Defaults to true. */
  enabled?: boolean;
  /**
   * Optional post list aligned with `data-watch-tile-index`. When provided,
   * the hook drives PrefetchController warming for tiles that are entering
   * the viewport — kills the multi-second cold fullscreen open for tiles
   * that never won activation.
   */
  posts?: FeedPost[];
  /**
   * Max concurrent active tiles. Rails leave this at 1 (default) to keep
   * one-active-per-rail. The Watch grid opts into 3 so multiple visible
   * tiles autoplay simultaneously (bounded by the RailLanePool budget).
   */
  maxActive?: number;
}

export interface UseWatchAutoplayResult {
  /**
   * Highest-visibility active tile (back-compat for single-active callers).
   * When `maxActive > 1`, this is simply the top of `activeIndices`.
   */
  activeIdx: number | null;
  /**
   * Full active set (size ≤ `maxActive`). Grid consumers gate playback
   * on `activeIndices.has(idx)`; single-active callers can ignore this.
   */
  activeIndices: Set<number>;
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
const EMPTY_SET: Set<number> = new Set();

export function useWatchAutoplay(
  { railId, enabled = true, posts, maxActive = 1 }: UseWatchAutoplayOptions,
): UseWatchAutoplayResult {
  const revealed = useWatchRevealed();
  const reducedMotion = usePrefersReducedMotion();
  const [docVisible, setDocVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden,
  );
  // Active set. Size ≤ maxActive. For single-active callers this is always
  // {} or a singleton — behavior unchanged. Grid uses maxActive=3.
  const [activeSet, setActiveSet] = useState<Set<number>>(() => new Set());
  const [root, setRoot] = useState<HTMLElement | null>(null);

  // Keep a ref to posts so the IO callback (inside a stable effect) can
  // resolve hlsUrl for approach-warming without re-running the observer.
  const postsRef = useRef<FeedPost[] | undefined>(posts);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  const railRef = useCallback((el: HTMLElement | null) => {
    // Stamp a scope marker on the container so nested useWatchAutoplay
    // instances can be isolated: a tile "belongs" to the hook whose root is
    // its NEAREST [data-autoplay-scope] ancestor. Prevents the outer feed
    // observer from ever seeing (and mis-resolving) a nested rail's tiles.
    if (el) el.setAttribute('data-autoplay-scope', railId);
    setRoot(el);
  }, [railId]);


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
      setActiveSet(new Set());
      ratiosRef.current.clear();
      return;
    }
    if (!root) return;

    const recompute = () => {
      // Rank tracked tiles by visibility, best-first.
      const ranked: Array<{ idx: number; ratio: number }> = [];
      ratiosRef.current.forEach((ratio, idx) => {
        ranked.push({ idx, ratio });
      });
      ranked.sort((a, b) => b.ratio - a.ratio);

      setActiveSet((prev) => {
        const next = new Set<number>();

        // 1) Keep incumbents that still clear PLAY_OUT (hysteresis) — top-N
        //    of the still-visible incumbents fill first so a rested set of
        //    tiles doesn't churn under micro-scroll.
        for (const { idx, ratio } of ranked) {
          if (next.size >= maxActive) break;
          if (prev.has(idx) && ratio >= PLAY_OUT) next.add(idx);
        }

        // 2) Fill remaining slots with fresh challengers that cleared PLAY_IN.
        //    "Play on entry" — a tile crossing PLAY_IN joins the active set
        //    up to maxActive, without needing to win most-visible.
        for (const { idx, ratio } of ranked) {
          if (next.size >= maxActive) break;
          if (next.has(idx)) continue;
          if (ratio >= PLAY_IN) next.add(idx);
        }

        // 3) Cold-start fallback: if nothing cleared PLAY_IN yet, admit the
        //    most-visible tile that at least reaches PLAY_OUT so the surface
        //    isn't dead on first paint.
        if (next.size === 0) {
          for (const { idx, ratio } of ranked) {
            if (ratio >= PLAY_OUT) { next.add(idx); break; }
          }
        }

        // Stable-ref shortcut when the set is identical.
        if (prev.size === next.size) {
          let same = true;
          for (const v of prev) if (!next.has(v)) { same = false; break; }
          if (same) return prev;
        }
        return next;
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
      if (!maxWaitTimer.current) {
        maxWaitTimer.current = setTimeout(runRecompute, MAX_SETTLE_MS);
      }
    };




    // A tile belongs to THIS hook iff its nearest [data-autoplay-scope]
    // ancestor is our root. This isolates nested rails (e.g. QuickClips
    // inside VideosFullFeed) so their tiles don't leak into the outer
    // observer's index-space and cause wrong-lane borrows on tap.
    const belongsToThisScope = (el: HTMLElement): boolean => {
      return el.closest('[data-autoplay-scope]') === root;
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
            // Approach-warm: EVERY visible tile is a candidate for tap →
            // warm manifest+first segment via PrefetchController. Coverage
            // widened (no upper bound) so tiles fully in-view but outside
            // the top-N active set still get cache-warmed for cold opens.
            const list = postsRef.current;
            if (list && entry.intersectionRatio >= APPROACH_MIN) {
              const post = list[idx];
              const media = post?.mediaItems?.find((m) => m.type === 'video');
              const hlsUrl = (media as any)?.hlsUrl as string | undefined;
              if (post && hlsUrl) {
                try { PrefetchController.request(`${post.id}:0`, hlsUrl); } catch { /* noop */ }
              }
            }
          } else {
            ratiosRef.current.delete(idx);
          }
          touched = true;
        }
        if (touched) scheduleRecompute();
      },
      { threshold: IO_THRESHOLDS },
    );

    const observeOwnTiles = (candidates: NodeListOf<HTMLElement> | HTMLElement[]) => {
      candidates.forEach((t) => {
        if (belongsToThisScope(t)) io.observe(t);
      });
    };

    const initial = root.querySelectorAll<HTMLElement>('[data-watch-tile-index]');
    observeOwnTiles(initial);
    scheduleRecompute();

    const mo = new MutationObserver(() => {
      const next = root.querySelectorAll<HTMLElement>('[data-watch-tile-index]');
      observeOwnTiles(next);
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

  }, [eligible, root, maxActive]);

  const outSet = eligible ? activeSet : EMPTY_SET;
  // activeIdx = highest-visibility member of the set (back-compat).
  let activeIdx: number | null = null;
  if (outSet.size > 0) {
    let bestIdx = -1;
    let bestRatio = -1;
    for (const idx of outSet) {
      const r = ratiosRef.current.get(idx) ?? 0;
      if (r > bestRatio) { bestRatio = r; bestIdx = idx; }
    }
    activeIdx = bestIdx >= 0 ? bestIdx : null;
  }
  return { activeIdx, activeIndices: outSet, railRef };
}

export default useWatchAutoplay;
