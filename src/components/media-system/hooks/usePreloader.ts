import { useEffect, useRef } from 'react';
import { useMediaStore } from '../store/mediaStore';
import { preCreateHlsInstance, supportsNativeHls } from '../utils/hlsManager';
import { parseMasterManifest, parseSegmentManifest } from '../utils/manifestParser';
import { segmentCache } from '../utils/segmentCache';
import { getManifestTextCache } from '../utils/cachedHlsLoader';
import type { FeedPost } from '../types/media';

/**
 * Three-stage preload pipeline.
 *
 * Stage 1 — Manifest warm (2 items ahead): fetch manifest text (< 5 KB).
 * Stage 2 — Thumbnail prefetch (3 items ahead): warm browser image cache.
 * Stage 3 — HLS instance pre-creation (1 item ahead, hls.js only):
 *           loadSource without attachMedia for near-instant promotion.
 * Stage 4 — Segment prefetch (next item): reuse cached manifest text,
 *           fetch first 2 segments of lowest quality.
 *
 * Network-aware: reduces prefetch range on slow connections.
 * Uses AbortController to cancel speculative fetches on index change.
 * Manifest text cache is shared with cachedHlsLoader for dedup.
 */
export function usePreloader(posts: FeedPost[]) {
  const activeIndex = useMediaStore((s) => s.activeIndex);
  const abortRef = useRef<AbortController | null>(null);
  const warmedManifests = useRef<Set<string>>(new Set());
  const warmedPosters = useRef<Set<string>>(new Set());
  const manifestTextCache = getManifestTextCache();

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
            const response = await fetch(url, { signal, mode: 'cors' });
            const text = await response.text();
            manifestTextCache.set(url, text);
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
          const response = await fetch(prevUrl, { signal, mode: 'cors' });
          const text = await response.text();
          manifestTextCache.set(prevUrl, text);
          warmedManifests.current.add(prevUrl);
        } catch {
          // Silent
        }
      }

      // ── Stage 4: Segment prefetch for next item ──────────────
      if (strategy.stage === 'full' || strategy.stage === 'segments') {
        const nextPost = posts[activeIndex + 1];
        const nextUrl = nextPost?.mediaItems[0]?.hlsUrl;

        if (nextUrl && !signal.aborted) {
          try {
            // Use cached manifest text from Stage 1 if available
            let masterText = manifestTextCache.get(nextUrl);
            if (!masterText) {
              const masterResponse = await fetch(nextUrl, { signal, mode: 'cors' });
              masterText = await masterResponse.text();
              manifestTextCache.set(nextUrl, masterText);
            }
            const parsed = parseMasterManifest(masterText, nextUrl);

            if (parsed.lowestLevel && !signal.aborted) {
              const levelResponse = await fetch(parsed.lowestLevel.uri, { signal, mode: 'cors' });
              const levelText = await levelResponse.text();
              const segmentManifest = parseSegmentManifest(levelText, parsed.lowestLevel.uri);

              // Prefetch first 2 segments
              const firstSegments = segmentManifest.segments.slice(0, 2);
              for (const seg of firstSegments) {
                if (signal.aborted) break;
                if (segmentCache.has(seg.uri)) continue;

                try {
                  const segResponse = await fetch(seg.uri, { signal, mode: 'cors' });
                  const blob = await segResponse.blob();
                  segmentCache.set(seg.uri, blob);
                } catch {
                  break;
                }
              }
            }
          } catch {
            // Silent fail — speculative prefetching
          }
        }
      }

      // Prune manifest text cache — keep only entries within 10 of active index
      const urlsToKeep = new Set<string>();
      for (let i = Math.max(0, activeIndex - 10); i <= activeIndex + 10 && i < posts.length; i++) {
        const url = posts[i]?.mediaItems[0]?.hlsUrl;
        if (url) urlsToKeep.add(url);
      }
      for (const key of manifestTextCache.keys()) {
        if (!urlsToKeep.has(key)) {
          manifestTextCache.delete(key);
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
