import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

const POOL_SIZE = 2;
const ATTACH_THRESHOLD = 0.6;
const DETACH_THRESHOLD = 0.2;

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

    const isNativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (!hlsUrl || isNativeHls) {
      video.src = hlsUrl || mp4Fallback!;
      video.play().catch(() => {});
      return;
    }

    try {
      const { default: Hls } = await import('hls.js');
      if (!Hls.isSupported()) {
        if (mp4Fallback) { video.src = mp4Fallback; video.play().catch(() => {}); }
        return;
      }

      // TODO: re-wire cachedHlsLoader in Brief 3

      // Check video still belongs to this slot
      if (activeMapRef.current.get(slot) !== tileIdx) return;

      const hls = new Hls({
        startLevel: -1,
        capLevelToPlayerSize: false,
        abrEwmaDefaultEstimate: 5_000_000 > 0 ? 5_000_000 : 8_000_000,
        maxBufferLength: 8,
        maxMaxBufferLength: 16,
        enableWorker: true,
        loader: undefined,
      });

      hlsRefs.current[slot] = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (activeMapRef.current.get(slot) !== tileIdx) return;
        hls.currentLevel = 0;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal && mp4Fallback) {
          hls.destroy();
          hlsRefs.current[slot] = null;
          video.src = mp4Fallback;
          video.play().catch(() => {});
        }
      });
    } catch { /* silent */ }
  }, []);

  // Main IO observer
  useEffect(() => {
    if (isSlowNetwork()) return;

    const grid = gridRef.current;
    if (!grid || posts.length === 0) return;

    observerRef.current?.disconnect();

    const visibilityMap = new Map<number, number>();

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const idx = parseInt(el.dataset.exploreIndex ?? '', 10);
        if (isNaN(idx)) continue;
        visibilityMap.set(idx, entry.intersectionRatio);
      }

      // Find most visible video tile
      let bestIdx = -1;
      let bestRatio = 0;
      for (const [idx, ratio] of visibilityMap) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIdx = idx;
        }
      }

      // Detach slots whose tile has dropped below threshold
      for (const [slot, tileIdx] of activeMapRef.current) {
        const ratio = visibilityMap.get(tileIdx) ?? 0;
        if (ratio < DETACH_THRESHOLD) {
          activeMapRef.current.delete(slot);
          detachSlot(slot);
        }
      }

      // Attach best visible tile to a free slot
      if (bestIdx >= 0 && bestRatio >= ATTACH_THRESHOLD) {
        const alreadyActive = [...activeMapRef.current.values()].includes(bestIdx);
        if (!alreadyActive) {
          // Find a free slot
          let freeSlot = -1;
          for (let s = 0; s < POOL_SIZE; s++) {
            if (!activeMapRef.current.has(s)) { freeSlot = s; break; }
          }
          // If no free slot, evict slot 0
          if (freeSlot === -1) {
            const evictSlot = 0;
            const evictTile = activeMapRef.current.get(evictSlot)!;
            activeMapRef.current.delete(evictSlot);
            detachSlot(evictSlot);
            freeSlot = evictSlot;
          }

          const tile = grid.querySelector(`[data-explore-index="${bestIdx}"]`) as HTMLElement | null;
          const post = posts[bestIdx];
          const media = post?.mediaItems?.[0];
          if (tile && post && media && (media.hlsUrl || media.mp4Url)) {
            activeMapRef.current.set(freeSlot, bestIdx);
            attachToTile(freeSlot, bestIdx, post, tile);
          }
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
