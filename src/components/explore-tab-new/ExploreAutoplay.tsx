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

const prewarmedSet = new Set<number>();

const prewarmTile = async (hlsUrl: string, idx: number) => {
  if (prewarmedSet.has(idx)) return;
  prewarmedSet.add(idx);
  try {
    const masterText = await fetch(hlsUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
    const masterLines = masterText.split('\n');
    const streamIdx = masterLines.findIndex(l => l.startsWith('#EXT-X-STREAM-INF'));
    const levelRelUrl = streamIdx >= 0 ? masterLines[streamIdx + 1]?.trim() : null;
    if (!levelRelUrl || levelRelUrl.startsWith('#')) return;
    const masterBase = hlsUrl.substring(0, hlsUrl.lastIndexOf('/') + 1);
    const levelUrl = levelRelUrl.startsWith('http') ? levelRelUrl : new URL(levelRelUrl, masterBase).href;

    const levelText = await fetch(levelUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
    const lines = levelText.split('\n');
    const base = levelUrl.substring(0, levelUrl.lastIndexOf('/') + 1);

    const mapLine = lines.find(l => l.startsWith('#EXT-X-MAP:URI="'));
    if (mapLine) {
      const mapUri = mapLine.match(/#EXT-X-MAP:URI="([^"]+)"/)?.[1];
      if (mapUri) {
        const initUrl = mapUri.startsWith('http') ? mapUri : new URL(mapUri, base).href;
        fetch(initUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
      }
    }

    const segLine = lines.find(l => l.trim() && !l.startsWith('#'));
    if (segLine) {
      const segUrl = segLine.trim().startsWith('http') ? segLine.trim() : new URL(segLine.trim(), base).href;
      fetch(segUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
    }
  } catch { /* silent */ }
};

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

  const detachSlot = useCallback((slot: number, tileIdx: number) => {
    const video = poolRef.current[slot];
    if (!video) return;

    video.pause();
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
      video.removeEventListener('canplay', onCanPlay);
    };
    video.addEventListener('canplay', onCanPlay);

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

      const { createCachedLoader } = await import('@/components/media-system/utils/cachedHlsLoader');

      // Check video still belongs to this slot
      if (activeMapRef.current.get(slot) !== tileIdx) return;

      const hls = new Hls({
        startLevel: 0,
        maxBufferLength: 8,
        maxMaxBufferLength: 16,
        enableWorker: true,
        loader: createCachedLoader(Hls),
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
          detachSlot(slot, tileIdx);
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
            detachSlot(evictSlot, evictTile);
            freeSlot = evictSlot;
          }

          const tile = grid.querySelector(`[data-explore-index="${bestIdx}"]`) as HTMLElement | null;
          const post = posts[bestIdx];
          const media = post?.mediaItems?.[0];
          if (tile && post && media && (media.hlsUrl || media.mp4Url)) {
            activeMapRef.current.set(freeSlot, bestIdx);
            attachToTile(freeSlot, bestIdx, post, tile);

            // Pre-warm next 2 video tiles ahead
            const videoIndices = posts
              .map((p, i) => ({ i, hasVideo: !!(p.mediaItems?.[0]?.hlsUrl || p.mediaItems?.[0]?.mp4Url) }))
              .filter(p => p.hasVideo && p.i > bestIdx)
              .slice(0, 2)
              .map(p => p.i);

            for (const nextIdx of videoIndices) {
              const nextHlsUrl = posts[nextIdx]?.mediaItems?.[0]?.hlsUrl;
              if (nextHlsUrl) prewarmTile(nextHlsUrl, nextIdx);
            }
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
