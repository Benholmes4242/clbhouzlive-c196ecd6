import { useEffect, useRef } from 'react';
import { useMediaStore } from '../store/mediaStore';
import { preCreateHlsInstance, supportsNativeHls } from '../utils/hlsManager';
import type { FeedPost } from '../types/media';

/**
 * Three-stage preload pipeline.
 *
 * Stage 1 — Manifest warm (2 items ahead): fetch manifest text (< 5 KB).
 * Stage 2 — Thumbnail prefetch (3 items ahead): warm browser image cache.
 * Stage 3 — HLS instance pre-creation (1 item ahead, hls.js only):
 *           loadSource without attachMedia for near-instant promotion.
 *
 * Network-aware: reduces prefetch range on slow connections.
 * Uses AbortController to cancel speculative fetches on index change.
 */
export function usePreloader(posts: FeedPost[]) {
  const activeIndex = useMediaStore((s) => s.activeIndex);
  const abortRef = useRef<AbortController | null>(null);
  const warmedManifests = useRef<Set<string>>(new Set());
  const warmedPosters = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Abort any in-flight preloads from previous index
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const strategy = getPreloadStrategy();

    async function run() {
      const signal = controller.signal;

      // ── Stage 3: Pre-create HLS instance for next item ────────
      if (strategy.stage === 'full' && !supportsNativeHls()) {
        const next = posts[activeIndex + 1];
        const nextUrl = next?.mediaItems[0]?.hlsUrl;
        if (nextUrl) {
          preCreateHlsInstance(nextUrl).catch(() => {});
        }
      }

      // ── Stage 1: Manifest warm (2 items ahead) ───────────────
      for (let offset = 1; offset <= strategy.ahead; offset++) {
        if (signal.aborted) return;
        const post = posts[activeIndex + offset];
        const url = post?.mediaItems[0]?.hlsUrl;
        if (url && !warmedManifests.current.has(url)) {
          try {
            await fetch(url, { signal, mode: 'cors' });
            warmedManifests.current.add(url);
          } catch {
            // Silent — speculative
          }
        }
      }

      // ── Stage 2: Thumbnail prefetch (3 items ahead) ──────────
      for (let offset = 1; offset <= strategy.ahead + 1; offset++) {
        if (signal.aborted) return;
        const post = posts[activeIndex + offset];
        const thumb = post?.mediaItems[0]?.thumbnailUrl;
        if (thumb && !warmedPosters.current.has(thumb)) {
          const img = new Image();
          img.src = thumb;
          warmedPosters.current.add(thumb);
        }
      }

      // Also warm previous item's manifest for back-nav
      const prev = posts[activeIndex - 1];
      const prevUrl = prev?.mediaItems[0]?.hlsUrl;
      if (prevUrl && !warmedManifests.current.has(prevUrl)) {
        try {
          await fetch(prevUrl, { signal, mode: 'cors' });
          warmedManifests.current.add(prevUrl);
        } catch {
          // Silent
        }
      }
    }

    run();

    return () => controller.abort();
  }, [activeIndex, posts]);
}

function getPreloadStrategy(): { ahead: number; stage: 'manifest' | 'segments' | 'full' } {
  const conn = (navigator as any).connection;
  if (!conn) return { ahead: 2, stage: 'full' };

  const type = conn.effectiveType;
  if (type === '4g') return { ahead: 2, stage: 'full' };
  if (type === '3g') return { ahead: 1, stage: 'segments' };
  if (type === '2g' || type === 'slow-2g') return { ahead: 0, stage: 'manifest' };
  return { ahead: 1, stage: 'segments' };
}
