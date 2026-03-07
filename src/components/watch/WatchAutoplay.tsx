import { useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

const VIDEO_POOL_SIZE = 2;

const perf = (tag: string, ...args: any[]) => {
  console.log(`[PERF:${tag}] ${Date.now() % 100000}`, ...args);
};

interface WatchAutoplayProps {
  posts: FeedPost[];
  gridRef: React.RefObject<HTMLDivElement>;
}

const WatchAutoplay: React.FC<WatchAutoplayProps> = ({ posts, gridRef }) => {
  const videoPoolRef = useRef<HTMLVideoElement[]>([]);
  const hlsPoolRef = useRef<(any | null)[]>([null, null]);
  const assignedTileRef = useRef<(number | null)[]>([null, null]);
  const ratioMapRef = useRef<Map<number, number>>(new Map());
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

    const { default: Hls } = await import('hls.js');
    if (assignedTileRef.current[slot] !== tileIdx) return; // slot reassigned during async gap

    if (!Hls.isSupported()) {
      video.src = hlsUrl;
      video.play().catch(() => {});
      return;
    }

    const hls = new Hls({
      startLevel: 0,
      maxBufferLength: 5,
      maxMaxBufferLength: 10,
      enableWorker: true,
    });
    hlsPoolRef.current[slot] = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (assignedTileRef.current[slot] !== tileIdx) return;
      hls.currentLevel = 0;
      // @ts-ignore
      hls.autoLevelEnabled = false;
      perf('WATCH', 'PLAY ATTEMPT tileIndex:', tileIdx, 'slot:', slot, 'readyState:', video.readyState);
      video.play().catch(() => {});
    });

    // Clean any previous listener before adding new one
    if ((video as any)._onPlaying) {
      video.removeEventListener('playing', (video as any)._onPlaying);
      (video as any)._onPlaying = null;
    }
    const onPlaying = () => {
      perf('WATCH', '<<< PLAYING tileIndex:', tileIdx, 'slot:', slot);
    };
    (video as any)._onPlaying = onPlaying;
    video.addEventListener('playing', onPlaying, { once: true });

    if ((video as any)._onCanPlay) {
      video.removeEventListener('canplay', (video as any)._onCanPlay);
      (video as any)._onCanPlay = null;
    }
    const onCanPlay = () => {
      perf('WATCH', 'CAN PLAY tileIndex:', tileIdx, 'readyState:', video.readyState);
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

  const detachSlot = useCallback((slot: number) => {
    perf('WATCH', 'DETACH slot:', slot, 'tileIndex:', assignedTileRef.current[slot]);
    const currentTile = assignedTileRef.current[slot];
    if (currentTile === null) return;

    const video = videoPoolRef.current[slot];
    if (!video) return;

    // Restore poster opacity
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

    assignedTileRef.current[slot] = null;
  }, []);

  const reconcilePool = useCallback(() => {
    const currentPosts = postsRef.current;
    const grid = gridRef.current;
    if (!grid || currentPosts.length === 0) return;

    // Sort visible tiles by ratio descending, take top 2
    const COLUMNS = 3;
    const top2 = [...ratioMapRef.current.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, VIDEO_POOL_SIZE)
      .map(([idx]) => idx);

    // Enforce minimum gap: the two playing tiles must not be in the same row
    if (top2.length === 2) {
      const row0 = Math.floor(top2[0] / COLUMNS);
      const row1 = Math.floor(top2[1] / COLUMNS);
      if (Math.abs(row0 - row1) < 1) {
        top2.splice(1, 1); // drop the second — same row
      }
    }

    perf('WATCH', 'reconcile top2:', top2, 'assigned:', [...assignedTileRef.current]);

    for (let slot = 0; slot < VIDEO_POOL_SIZE; slot++) {
      const currentTile = assignedTileRef.current[slot];
      const desiredTile = top2[slot] ?? null;

      if (currentTile === desiredTile) continue;

      // Don't steal a tile already assigned to the other slot
      if (desiredTile !== null) {
        const otherSlot = slot === 0 ? 1 : 0;
        if (assignedTileRef.current[otherSlot] === desiredTile) continue;
      }

      // Detach from current tile
      detachSlot(slot);

      // Attach to new tile
      if (desiredTile !== null) {
        const post = currentPosts[desiredTile];
        const hlsUrl = post?.mediaItems?.[0]?.hlsUrl;
        if (!hlsUrl) continue;
        const tileEl = grid.querySelector(`[data-watch-index="${desiredTile}"]`) as HTMLElement | null;
        if (!tileEl) continue;

        assignedTileRef.current[slot] = desiredTile;
        perf('WATCH', 'ATTACH START tileIndex:', desiredTile, 'slot:', slot);
        attachToTile(slot, desiredTile, hlsUrl, tileEl);
      }
    }
  }, [gridRef, attachToTile, detachSlot]);

  // IntersectionObserver — observe ALL tiles
  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0 || videoPoolRef.current.length === 0) return;

    ratioMapRef.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.watchIndex);
          if (isNaN(idx)) continue;

          if (entry.intersectionRatio < 0.2) {
            ratioMapRef.current.delete(idx);
            // If this tile was assigned, detach it
            for (let slot = 0; slot < VIDEO_POOL_SIZE; slot++) {
              if (assignedTileRef.current[slot] === idx) {
                detachSlot(slot);
              }
            }
          } else {
            const prev = ratioMapRef.current.get(idx);
            if (!prev) {
              perf('WATCH', '>>> VISIBLE tileIndex:', idx, 'ratio:', entry.intersectionRatio.toFixed(2));
            }
            ratioMapRef.current.set(idx, entry.intersectionRatio);
          }
        }

        reconcilePool();
      },
      { threshold: [0, 0.2, 0.6, 1.0] }
    );

    const tiles = grid.querySelectorAll('[data-watch-index]');
    tiles.forEach((tile) => observer.observe(tile));

    return () => {
      observer.disconnect();
      for (let slot = 0; slot < VIDEO_POOL_SIZE; slot++) {
        hlsPoolRef.current[slot]?.destroy();
        hlsPoolRef.current[slot] = null;
        const video = videoPoolRef.current[slot];
        if (video) {
          video.pause();
          video.remove();
        }
        assignedTileRef.current[slot] = null;
      }
      ratioMapRef.current.clear();
    };
  }, [posts, gridRef, isSlowNetwork, reconcilePool, detachSlot]);

  return null;
};

export default WatchAutoplay;
