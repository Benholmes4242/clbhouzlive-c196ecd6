import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { attachHlsToTile, prefetchTile } from '@/hooks/useTileVideoPlayer';

const POOL_SIZE = 2;
const ATTACH_THRESHOLD = 0.5;
const DETACH_THRESHOLD = 0.25;

function isSlowNetwork(): boolean {
  const conn = (navigator as any).connection;
  if (!conn) return false;
  const ect = conn.effectiveType;
  return ect === '2g' || ect === 'slow-2g';
}

interface ExploreAutoplayProps {
  posts: FeedPost[];
  gridRef: RefObject<HTMLElement>;
}

export default function ExploreAutoplay({ posts, gridRef }: ExploreAutoplayProps) {
  const poolRef = useRef<HTMLVideoElement[]>([]);
  const hlsRefs = useRef<(any | null)[]>([null, null]);
  const activeMapRef = useRef<Map<number, number>>(new Map()); // slot → tileIdx
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedTilesRef = useRef<number>(0);

  // Create video pool once on mount
  useEffect(() => {
    if (isSlowNetwork()) return;

    const pool: HTMLVideoElement[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      pool.push(video);
    }
    poolRef.current = pool;

    return () => {
      pool.forEach((video, slot) => {
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (video.parentElement) video.parentElement.removeChild(video);
        hlsRefs.current[slot]?.destroy();
        hlsRefs.current[slot] = null;
      });
      poolRef.current = [];
    };
  }, []);

  const detachSlot = useCallback((slot: number) => {
    const video = poolRef.current[slot];
    if (!video) return;

    video.pause();
    if ((video as any)._exploreCanPlayHandler) {
      video.removeEventListener('canplay', (video as any)._exploreCanPlayHandler);
      (video as any)._exploreCanPlayHandler = null;
    }
    video.style.opacity = '0';
    video.removeAttribute('src');
    video.load();

    hlsRefs.current[slot]?.destroy();
    hlsRefs.current[slot] = null;

    if (video.parentElement) {
      video.parentElement.removeChild(video);
    }
  }, []);

  const attachToTile = useCallback(async (slot: number, tileIdx: number, post: FeedPost, tile: HTMLElement) => {
    const video = poolRef.current[slot];
    if (!video) return;

    const media = post.mediaItems[0];
    if (!media) return;

    const hlsUrl = media.hlsUrl;
    const mp4Fallback = media.mp4Url;
    if (!hlsUrl && !mp4Fallback) return;

    // Position video over tile
    video.style.position = 'absolute';
    video.style.inset = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.opacity = '0';
    video.style.transition = 'opacity 200ms ease';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '1';
    tile.style.position = 'relative';
    tile.appendChild(video);

    const onCanPlay = () => {
      video.style.opacity = '1';
    };
    video.addEventListener('canplay', onCanPlay, { once: true });
    (video as any)._exploreCanPlayHandler = onCanPlay;

    try {
      const hls = await attachHlsToTile({
        hlsUrl: hlsUrl || '',
        mp4Fallback: mp4Fallback || undefined,
        video,
      });
      hlsRefs.current[slot] = hls;
    } catch { /* silent */ }
  }, []);

  // Main IO observer
  useEffect(() => {
    if (isSlowNetwork()) return;

    const grid = gridRef.current;
    if (!grid || posts.length === 0 || poolRef.current.length === 0) return;

    observerRef.current?.disconnect();

    const visibilityMap = new Map<number, number>();

    const observer = new IntersectionObserver((entries) => {
      // Update visibility ratios
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const idx = parseInt(el.dataset.exploreIndex ?? '', 10);
        if (isNaN(idx)) continue;
        visibilityMap.set(idx, entry.intersectionRatio);
      }

      // Rank all visible video tiles by intersection ratio, descending
      const ranked = [...visibilityMap.entries()]
        .filter(([, ratio]) => ratio >= ATTACH_THRESHOLD)
        .sort(([, a], [, b]) => b - a)
        .slice(0, POOL_SIZE)
        .map(([idx]) => idx);

      // Detach slots whose tile is no longer in top-2 or below threshold
      for (const [slot, tileIdx] of activeMapRef.current) {
        const ratio = visibilityMap.get(tileIdx) ?? 0;
        if (ratio < DETACH_THRESHOLD || !ranked.includes(tileIdx)) {
          activeMapRef.current.delete(slot);
          detachSlot(slot);
        }
      }

      // Attach top-2 visible tiles to available slots
      for (const tileIdx of ranked) {
        const alreadyActive = [...activeMapRef.current.values()].includes(tileIdx);
        if (alreadyActive) continue;

        // Find a free slot
        let freeSlot = -1;
        for (let s = 0; s < POOL_SIZE; s++) {
          if (!activeMapRef.current.has(s)) { freeSlot = s; break; }
        }
        if (freeSlot === -1) continue;

        const tile = grid.querySelector(`[data-explore-index="${tileIdx}"]`) as HTMLElement | null;
        const post = posts[tileIdx];
        const media = post?.mediaItems?.[0];
        if (tile && post && media && (media.hlsUrl || media.mp4Url)) {
          activeMapRef.current.set(freeSlot, tileIdx);
          attachToTile(freeSlot, tileIdx, post, tile);

          // Prefetch the next video tile
          const nextPost = posts[tileIdx + 1];
          const nextHlsUrl = nextPost?.mediaItems?.[0]?.hlsUrl;
          if (nextHlsUrl) prefetchTile(nextHlsUrl);
        }
      }
    }, { threshold: [0, DETACH_THRESHOLD, ATTACH_THRESHOLD, 1.0] });

    observerRef.current = observer;

    // Observe only video tiles
    const tiles = grid.querySelectorAll('[data-explore-index]');
    tiles.forEach((tile) => {
      const idx = parseInt((tile as HTMLElement).dataset.exploreIndex ?? '', 10);
      if (isNaN(idx)) return;
      const media = posts[idx]?.mediaItems?.[0];
      if (media?.hlsUrl || media?.mp4Url) {
        observer.observe(tile);
      }
    });

    observedTilesRef.current = posts.length;

    return () => { observer.disconnect(); };
  }, [posts, gridRef, attachToTile, detachSlot]);

  // Re-observe new tiles on infinite scroll
  useEffect(() => {
    if (posts.length <= observedTilesRef.current) return;
    const grid = gridRef.current;
    const observer = observerRef.current;
    if (!grid || !observer) return;

    const tiles = grid.querySelectorAll('[data-explore-index]');
    tiles.forEach((tile) => {
      const idx = parseInt((tile as HTMLElement).dataset.exploreIndex ?? '', 10);
      if (isNaN(idx) || idx < observedTilesRef.current) return;
      const media = posts[idx]?.mediaItems?.[0];
      if (media?.hlsUrl || media?.mp4Url) {
        observer.observe(tile);
      }
    });

    observedTilesRef.current = posts.length;
  }, [posts.length, gridRef]);

  return null;
}
