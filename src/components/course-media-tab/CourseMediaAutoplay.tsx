import { useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { attachHlsToTile, prefetchTile } from '@/hooks/useTileVideoPlayer';

const ATTACH_THRESHOLD = 0.6;
const DETACH_THRESHOLD = 0.2;

interface CourseMediaAutoplayProps {
  posts: FeedPost[];
  gridRef: React.RefObject<HTMLDivElement>;
}

export const CourseMediaAutoplay: React.FC<CourseMediaAutoplayProps> = ({ posts, gridRef }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const activeIndexRef = useRef<number | null>(null);
  const autoplayObserverRef = useRef<IntersectionObserver | null>(null);
  const prewarmObserverRef = useRef<IntersectionObserver | null>(null);
  const observedTilesRef = useRef<Set<number>>(new Set());
  const prewarmedSetRef = useRef<Set<number>>(new Set());
  const postsRef = useRef<FeedPost[]>(posts);
  postsRef.current = posts;

  const isSlowNetwork = useCallback(() => {
    const connection = (navigator as any).connection;
    const type = connection?.effectiveType || '4g';
    return type === '2g' || type === 'slow-2g';
  }, []);

  

  const prewarmTile = useCallback(async (hlsUrl: string) => {
    try {
      const masterText = await fetch(hlsUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
      const lines = masterText.split('\n');
      const streamIdx = lines.findIndex(l => l.startsWith('#EXT-X-STREAM-INF'));
      const levelRelUrl = streamIdx >= 0 ? lines[streamIdx + 1]?.trim() : null;
      if (!levelRelUrl || levelRelUrl.startsWith('#')) return;
      const masterBase = hlsUrl.substring(0, hlsUrl.lastIndexOf('/') + 1);
      const levelUrl = levelRelUrl.startsWith('http') ? levelRelUrl : new URL(levelRelUrl, masterBase).href;

      const levelText = await fetch(levelUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
      const levelLines = levelText.split('\n');
      const base = levelUrl.substring(0, levelUrl.lastIndexOf('/') + 1);

      const mapLine = levelLines.find(l => l.startsWith('#EXT-X-MAP:URI="'));
      if (mapLine) {
        const mapUri = mapLine.match(/#EXT-X-MAP:URI="([^"]+)"/)?.[1];
        if (mapUri) {
          const initUrl = mapUri.startsWith('http') ? mapUri : new URL(mapUri, base).href;
          fetch(initUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
        }
      }

      const segLine = levelLines.find(l => l.trim() && !l.startsWith('#'));
      if (segLine) {
        const segUrl = segLine.trim().startsWith('http') ? segLine.trim() : new URL(segLine.trim(), base).href;
        fetch(segUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
      }
    } catch {
      // silent
    }
  }, []);

  // Create persistent video element
  useEffect(() => {
    if (isSlowNetwork()) return;

    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.setAttribute('webkit-playsinline', '');
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:1;';
    videoRef.current = v;

    return () => {
      v.pause();
      v.remove();
      videoRef.current = null;
    };
  }, [isSlowNetwork]);

  const attachToTile = useCallback(async (tileIdx: number, hlsUrl: string, tileEl: HTMLElement) => {
    if (isSlowNetwork()) return;
    const video = videoRef.current;
    if (!video) return;

    // Detach from previous
    detachCurrent();

    activeIndexRef.current = tileIdx;
    tileEl.style.position = 'relative';
    tileEl.appendChild(video);

    const { default: Hls } = await import('hls.js');
    // TODO: re-wire cachedHlsLoader in Brief 3

    if (activeIndexRef.current !== tileIdx) return;

    if (!Hls.isSupported()) {
      video.src = hlsUrl;
      video.play().catch(() => {});
      return;
    }

    const hls = new Hls({
      startLevel: -1,
      capLevelToPlayerSize: false,
      abrEwmaDefaultEstimate: 5_000_000 > 0 ? 5_000_000 : 8_000_000,
      maxBufferLength: 8,
      maxMaxBufferLength: 16,
      enableWorker: true,
      loader: undefined,
    });
    hlsRef.current = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (activeIndexRef.current !== tileIdx) return;
      hls.currentLevel = 0;
      video.play().catch(() => {});
    });

    // Cleanup stale listeners
    if ((video as any)._onCanPlay) {
      video.removeEventListener('canplay', (video as any)._onCanPlay);
    }
    const onCanPlay = () => {
      const poster = tileEl.querySelector('img');
      if (poster) {
        (poster as HTMLElement).style.transition = 'opacity 200ms ease';
        (poster as HTMLElement).style.opacity = '0';
      }
      if (video.paused) video.play().catch(() => {});
    };
    (video as any)._onCanPlay = onCanPlay;
    video.addEventListener('canplay', onCanPlay, { once: true });
  }, [isSlowNetwork]);

  const detachCurrent = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const parent = video.parentElement;
    if (parent) {
      const poster = parent.querySelector('img');
      if (poster) {
        (poster as HTMLElement).style.transition = 'opacity 150ms ease';
        (poster as HTMLElement).style.opacity = '1';
      }
    }

    if ((video as any)._onCanPlay) {
      video.removeEventListener('canplay', (video as any)._onCanPlay);
      (video as any)._onCanPlay = null;
    }

    video.pause();
    if (video.parentElement) video.parentElement.removeChild(video);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    activeIndexRef.current = null;
  }, []);

  // Autoplay observer
  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0 || !videoRef.current) return;

    activeIndexRef.current = null;
    observedTilesRef.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.courseMediaIndex);
          const tileHlsUrl = postsRef.current[idx]?.mediaItems?.[0]?.hlsUrl;
          if (isNaN(idx) || !tileHlsUrl) continue;


          if (entry.intersectionRatio >= ATTACH_THRESHOLD) {
            if (activeIndexRef.current !== idx) {
              attachToTile(idx, tileHlsUrl, el);
            }
          } else if (entry.intersectionRatio < DETACH_THRESHOLD) {
            if (activeIndexRef.current === idx) {
              detachCurrent();
            }
          }
        }
      },
      { threshold: [0, DETACH_THRESHOLD, ATTACH_THRESHOLD, 1.0] }
    );
    autoplayObserverRef.current = observer;

    const timer = setTimeout(() => {
      const tiles = grid.querySelectorAll('[data-course-media-index]');
      tiles.forEach((tile) => {
        const idx = Number((tile as HTMLElement).dataset.courseMediaIndex);
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
      detachCurrent();
    };
  }, [posts, gridRef, isSlowNetwork, attachToTile, detachCurrent]);

  // Pre-warm observer
  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0) return;

    prewarmedSetRef.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.courseMediaIndex);
          if (isNaN(idx) || prewarmedSetRef.current.has(idx)) continue;
          const post = postsRef.current[idx];
          const hlsUrl = post?.mediaItems?.[0]?.hlsUrl;
          if (!hlsUrl) continue;
          prewarmedSetRef.current.add(idx);
          prewarmTile(hlsUrl);
        }
      },
      { rootMargin: '800px' }
    );
    prewarmObserverRef.current = observer;

    const timer = setTimeout(() => {
      const tiles = grid.querySelectorAll('[data-course-media-index]');
      tiles.forEach((tile) => {
        const idx = parseInt((tile as HTMLElement).dataset.courseMediaIndex ?? '', 10);
        if (isNaN(idx)) return;
        const tileHlsUrl = postsRef.current[idx]?.mediaItems?.[0]?.hlsUrl;
        if (!tileHlsUrl) return;
        if (!prewarmedSetRef.current.has(idx)) {
          observer.observe(tile);
        }
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      prewarmObserverRef.current = null;
      prewarmedSetRef.current.clear();
    };
  }, [posts, gridRef, isSlowNetwork, prewarmTile]);

  // Re-observe new tiles as infinite scroll loads
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const tiles = grid.querySelectorAll('[data-course-media-index]');
    tiles.forEach((tile) => {
      const idx = parseInt((tile as HTMLElement).dataset.courseMediaIndex ?? '', 10);
      if (isNaN(idx)) return;
      const tileHlsUrl = postsRef.current[idx]?.mediaItems?.[0]?.hlsUrl;
      if (!tileHlsUrl) return;
      if (autoplayObserverRef.current && !observedTilesRef.current.has(idx)) {
        observedTilesRef.current.add(idx);
        autoplayObserverRef.current.observe(tile);
      }
      if (prewarmObserverRef.current && !prewarmedSetRef.current.has(idx)) {
        prewarmObserverRef.current.observe(tile);
      }
    });
  }, [posts.length, gridRef]);

  return null;
};
