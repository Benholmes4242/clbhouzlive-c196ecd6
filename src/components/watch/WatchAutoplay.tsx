import { useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { attachHlsToTile, prefetchTile } from '@/hooks/useTileVideoPlayer';

const VIDEO_POOL_SIZE = 2;
const AUTOPLAY_THRESHOLD = 0.5;

const isDesignatedTile = (idx: number) => {
  const row = Math.floor(idx / 3);
  const rowMod = row % 4;
  if (rowMod === 0) return idx % 3 === 0; // left col only
  if (rowMod === 2) return idx % 3 === 2; // right col only
  return false;
};
const slotForTile = (idx: number) => {
  const row = Math.floor(idx / 3);
  const rowMod = row % 4;
  if (rowMod === 0) return 0;
  if (rowMod === 2) return 1;
  return -1;
};

interface WatchAutoplayProps {
  posts: FeedPost[];
  gridRef: React.RefObject<HTMLDivElement>;
}

const WatchAutoplay: React.FC<WatchAutoplayProps> = ({ posts, gridRef }) => {
  const videoPoolRef = useRef<HTMLVideoElement[]>([]);
  const hlsPoolRef = useRef<(any | null)[]>([null, null]);
  const activeMapRef = useRef<Map<number, number>>(new Map());
  const autoplayObserverRef = useRef<IntersectionObserver | null>(null);
  const observedTilesRef = useRef<Set<number>>(new Set());
  const postsRef = useRef<FeedPost[]>(posts);
  postsRef.current = posts;

  const isSlowNetwork = useCallback(() => {
    const connection = (navigator as any).connection;
    const type = connection?.effectiveType || '4g';
    return type === '2g' || type === 'slow-2g';
  }, []);

  // Create persistent video pool
  useEffect(() => {
    if (isSlowNetwork()) return;

    const pool: HTMLVideoElement[] = [];
    for (let i = 0; i < VIDEO_POOL_SIZE; i++) {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.setAttribute('webkit-playsinline', '');
      v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:1;';
      pool.push(v);
    }
    videoPoolRef.current = pool;

    return () => {
      pool.forEach((v) => {
        v.pause();
        v.remove();
      });
      videoPoolRef.current = [];
    };
  }, [isSlowNetwork]);

  const attachToTile = useCallback(async (slot: number, tileIdx: number, hlsUrl: string, tileEl: HTMLElement) => {
    if (isSlowNetwork()) return;
    const video = videoPoolRef.current[slot];
    if (!video) return;

    tileEl.style.position = 'relative';
    tileEl.appendChild(video);

    if (activeMapRef.current.get(slot) !== tileIdx) return;

    try {
      const hls = await attachHlsToTile({
        hlsUrl,
        video,
      });
      hlsPoolRef.current[slot] = hls;
    } catch { /* silent */ }

    if ((video as any)._onPlaying) {
      video.removeEventListener('playing', (video as any)._onPlaying);
      (video as any)._onPlaying = null;
    }
    const onPlaying = () => {};
    (video as any)._onPlaying = onPlaying;
    video.addEventListener('playing', onPlaying, { once: true });

    if ((video as any)._onCanPlay) {
      video.removeEventListener('canplay', (video as any)._onCanPlay);
      (video as any)._onCanPlay = null;
    }
    const onCanPlay = () => {
      const poster = tileEl.querySelector('img');
      if (poster) {
        poster.style.transition = 'opacity 200ms ease';
        poster.style.opacity = '0';
      }
      if (video.paused) {
        video.play().catch(() => {});
      }
    };
    (video as any)._onCanPlay = onCanPlay;
    video.addEventListener('canplay', onCanPlay, { once: true });
  }, [isSlowNetwork]);

  const detachSlot = useCallback((slot: number, prevTile: number | undefined) => {
    if (prevTile === undefined) return;

    const video = videoPoolRef.current[slot];
    if (!video) return;

    const parent = video.parentElement;
    if (parent) {
      const poster = parent.querySelector('img');
      if (poster) {
        poster.style.transition = 'opacity 150ms ease';
        poster.style.opacity = '1';
      }
    }

    if ((video as any)._onPlaying) {
      video.removeEventListener('playing', (video as any)._onPlaying);
      (video as any)._onPlaying = null;
    }
    if ((video as any)._onCanPlay) {
      video.removeEventListener('canplay', (video as any)._onCanPlay);
      (video as any)._onCanPlay = null;
    }
    video.pause();
    if (video.parentElement) {
      video.parentElement.removeChild(video);
    }

    if (hlsPoolRef.current[slot]) {
      hlsPoolRef.current[slot].destroy();
      hlsPoolRef.current[slot] = null;
    }
  }, []);

  // IntersectionObserver — observe designated tiles only
  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0 || videoPoolRef.current.length === 0) return;

    const activeMap = activeMapRef.current;
    activeMap.clear();
    observedTilesRef.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.watchIndex);
          if (isNaN(idx) || !isDesignatedTile(idx)) continue;

          const slot = slotForTile(idx);
          const post = postsRef.current[idx];
          const hlsUrl = post?.mediaItems?.[0]?.hlsUrl;
          if (!hlsUrl) continue;

          if (entry.intersectionRatio >= AUTOPLAY_THRESHOLD) {
            if (activeMap.get(slot) !== idx) {
              const prevTile = activeMap.get(slot);
              activeMap.set(slot, idx);
              detachSlot(slot, prevTile);
              attachToTile(slot, idx, hlsUrl, el);
            }
          } else {
            if (activeMap.get(slot) === idx) {
              activeMap.delete(slot);
              detachSlot(slot, idx);
            }
          }
        }
      },
      { threshold: [0, AUTOPLAY_THRESHOLD] }
    );
    autoplayObserverRef.current = observer;

    const timer = setTimeout(() => {
      const tiles = grid.querySelectorAll('[data-watch-index]');
      tiles.forEach((tile) => {
        const idx = Number((tile as HTMLElement).dataset.watchIndex);
        if (!observedTilesRef.current.has(idx)) {
          observedTilesRef.current.add(idx);
          observer.observe(tile);
        }
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      autoplayObserverRef.current = null;
      observedTilesRef.current.clear();
      for (let slot = 0; slot < VIDEO_POOL_SIZE; slot++) {
        detachSlot(slot, activeMap.get(slot));
        const video = videoPoolRef.current[slot];
        if (video) {
          video.remove();
        }
      }
      activeMap.clear();
    };
  }, [posts, gridRef, isSlowNetwork, attachToTile, detachSlot]);

  // Re-observe new tiles as infinite scroll loads
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const tiles = grid.querySelectorAll('[data-watch-index]');
    tiles.forEach((tile) => {
      const idx = Number((tile as HTMLElement).dataset.watchIndex);
      if (isNaN(idx)) return;
      if (autoplayObserverRef.current && !observedTilesRef.current.has(idx)) {
        observedTilesRef.current.add(idx);
        autoplayObserverRef.current.observe(tile);
      }
    });
  }, [posts.length, gridRef]);

  return null;
};

export default WatchAutoplay;