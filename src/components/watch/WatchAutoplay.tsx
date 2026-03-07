import { useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

const VIDEO_POOL_SIZE = 2;
const AUTOPLAY_THRESHOLD = 0.5;

const isDesignatedTile = (idx: number) => idx % 6 === 0 || idx % 6 === 2;
const slotForTile = (idx: number) => idx % 6 === 0 ? 0 : 1;

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
  const activeMapRef = useRef<Map<number, number>>(new Map()); // slot → tileIdx
  const postsRef = useRef<FeedPost[]>(posts);
  postsRef.current = posts;

  const isSlowNetwork = useCallback(() => {
    const connection = (navigator as any).connection;
    const type = connection?.effectiveType || '4g';
    return type === '2g' || type === 'slow-2g';
  }, []);

  const prewarmTile = useCallback(async (hlsUrl: string, tileIdx: number) => {
    try {
      const masterText = await fetch(hlsUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
      const masterLines = masterText.split('\n');
      const streamIdx = masterLines.findIndex(l => l.startsWith('#EXT-X-STREAM-INF'));
      const levelRelUrl = streamIdx >= 0 ? masterLines[streamIdx + 1]?.trim() : null;
      if (!levelRelUrl || levelRelUrl.startsWith('#')) return;
      const masterBase = hlsUrl.substring(0, hlsUrl.lastIndexOf('/') + 1);
      const levelUrl = levelRelUrl.startsWith('http')
        ? levelRelUrl
        : new URL(levelRelUrl, masterBase).href;

      const levelText = await fetch(levelUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
      const lines = levelText.split('\n');
      const base = levelUrl.substring(0, levelUrl.lastIndexOf('/') + 1);

      // Pre-warm init segment
      const mapLine = lines.find(l => l.startsWith('#EXT-X-MAP:URI="'));
      if (mapLine) {
        const mapUri = mapLine.match(/#EXT-X-MAP:URI="([^"]+)"/)?.[1];
        if (mapUri) {
          const initUrl = mapUri.startsWith('http') ? mapUri : new URL(mapUri, base).href;
          perf('WATCH', 'pre-warm init tileIndex:', tileIdx, initUrl.slice(-40));
          fetch(initUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
        }
      }

      // Pre-warm first media segment
      const segLine = lines.find(l => l.trim() && !l.startsWith('#'));
      if (segLine) {
        const segUrl = segLine.trim().startsWith('http')
          ? segLine.trim()
          : new URL(segLine.trim(), base).href;
        perf('WATCH', 'pre-warm seg tileIndex:', tileIdx, segUrl.slice(-40));
        fetch(segUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
      }
    } catch {
      // silent
    }
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
    if (activeMapRef.current.get(slot) !== tileIdx) return; // slot reassigned during async gap

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
      if (activeMapRef.current.get(slot) !== tileIdx) return;
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
    const currentTile = activeMapRef.current.get(slot);
    perf('WATCH', 'DETACH slot:', slot, 'tileIndex:', currentTile);
    if (currentTile === undefined) return;

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

    activeMapRef.current.delete(slot);
  }, []);

  // IntersectionObserver — observe designated tiles only
  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0 || videoPoolRef.current.length === 0) return;

    const activeMap = activeMapRef.current;
    activeMap.clear();

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
            // attach if not already
            if (activeMap.get(slot) !== idx) {
              perf('WATCH', 'ATTACH START tileIndex:', idx, 'slot:', slot, 'ratio:', entry.intersectionRatio);
              detachSlot(slot);
              activeMap.set(slot, idx);
              attachToTile(slot, idx, hlsUrl, el);
            }
          } else {
            if (activeMap.get(slot) === idx) {
              perf('WATCH', 'BELOW THRESHOLD tileIndex:', idx, 'slot:', slot, 'ratio:', entry.intersectionRatio);
              detachSlot(slot);
            }
          }
        }
      },
      { threshold: [0, AUTOPLAY_THRESHOLD] }
    );

    const timer = setTimeout(() => {
      const tiles = grid.querySelectorAll('[data-watch-index]');
      tiles.forEach((tile) => observer.observe(tile));
    }, 0);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      for (let slot = 0; slot < VIDEO_POOL_SIZE; slot++) {
        hlsPoolRef.current[slot]?.destroy();
        hlsPoolRef.current[slot] = null;
        const video = videoPoolRef.current[slot];
        if (video) {
          video.pause();
          video.remove();
        }
      }
      activeMap.clear();
    };
  }, [posts, gridRef, isSlowNetwork, attachToTile, detachSlot]);

  // Pre-warm observer — fetch manifests + first segments before tiles enter viewport
  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0) return;

    const prewarmedSet = new Set<number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.watchIndex);
          if (isNaN(idx) || prewarmedSet.has(idx)) continue;
          const post = postsRef.current[idx];
          const hlsUrl = post?.mediaItems?.[0]?.hlsUrl;
          if (!hlsUrl) continue;
          prewarmedSet.add(idx);
          perf('WATCH', 'pre-warm START tileIndex:', idx);
          prewarmTile(hlsUrl, idx);
        }
      },
      { rootMargin: '800px' }
    );

    // Defer to next tick so tiles are in DOM
    const timer = setTimeout(() => {
      const tiles = grid.querySelectorAll('[data-watch-index]');
      tiles.forEach(tile => observer.observe(tile));
    }, 0);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [posts, gridRef, isSlowNetwork, prewarmTile]);

  return null;
};

export default WatchAutoplay;
