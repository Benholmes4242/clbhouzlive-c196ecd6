import { useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

const dbg = (tag: string, ...args: any[]) => {
  console.log(`[${tag}] ${Date.now() % 100000}`, ...args);
};

function isAutoplayTile(index: number): boolean {
  return index % 6 === 0;
}

interface WatchAutoplayProps {
  posts: FeedPost[];
  gridRef: React.RefObject<HTMLDivElement>;
}

const WatchAutoplay: React.FC<WatchAutoplayProps> = ({ posts, gridRef }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const activeIndexRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check network — disable on slow connections
  const isSlowNetwork = useCallback(() => {
    const connection = (navigator as any).connection;
    const type = connection?.effectiveType || '4g';
    dbg('W:AUTO', 'Network check:', type, 'slow:', type === '2g' || type === 'slow-2g');
    return type === '2g' || type === 'slow-2g';
  }, []);

  // Create single video element on mount
  useEffect(() => {
    if (isSlowNetwork()) {
      dbg('W:AUTO', 'Autoplay DISABLED — slow network');
      return;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute('webkit-playsinline', '');
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;';
    videoRef.current = video;
    dbg('W:AUTO', 'Video element created');

    return () => {
      dbg('W:AUTO', 'Cleanup — destroying HLS, disconnecting observer');
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.remove();
      videoRef.current = null;
    };
  }, [isSlowNetwork]);

  // Attach HLS to a tile
  const attachToTile = useCallback(async (index: number) => {
    const grid = gridRef.current;
    const video = videoRef.current;
    if (!grid || !video || isSlowNetwork()) return;

    const tile = grid.querySelector(`[data-watch-index="${index}"]`) as HTMLElement | null;
    if (!tile) return;

    const post = posts[index];
    const hlsUrl = post?.mediaItems[0]?.hlsUrl;
    if (!hlsUrl) return;

    dbg('W:AUTO', 'Attaching to tile index:', index, 'hlsUrl:', hlsUrl?.slice(-40));

    // Pause & detach previous
    video.pause();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reparent video element into new tile
    tile.appendChild(video);
    activeIndexRef.current = index;

    // Dynamically import hls.js
    const { default: Hls } = await import('hls.js');
    if (!Hls.isSupported()) {
      video.src = hlsUrl;
      video.play().then(() => {
        dbg('W:AUTO', 'play() SUCCESS for index:', index);
      }).catch((error) => {
        dbg('W:AUTO', 'play() FAILED for index:', index, error?.name, error?.message);
      });
      return;
    }

    const hls = new Hls({
      startLevel: 0,
      maxBufferLength: 5,
      maxMaxBufferLength: 10,
      enableWorker: true,
    });

    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      dbg('W:AUTO', 'HLS manifest parsed for index:', index);
      hls.currentLevel = 0;
      // @ts-ignore
      hls.autoLevelEnabled = false;
      video.play().then(() => {
        dbg('W:AUTO', 'play() SUCCESS for index:', index);
      }).catch((error) => {
        dbg('W:AUTO', 'play() FAILED for index:', index, error?.name, error?.message);
      });
    });

    // Crossfade: hide poster when video ready
    const onCanPlay = () => {
      dbg('W:AUTO', 'Video canplay, crossfading poster for index:', index);
      const poster = tile.querySelector('img');
      if (poster) {
        poster.style.transition = 'opacity 200ms ease';
        poster.style.opacity = '0';
      }
    };
    video.addEventListener('canplay', onCanPlay, { once: true });

    hlsRef.current = hls;
  }, [posts, gridRef, isSlowNetwork]);

  // Detach from current tile
  const detachCurrent = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    dbg('W:AUTO', 'Detaching from index:', activeIndexRef.current);
    video.pause();
    
    // Restore poster opacity on the tile we're leaving
    const parent = video.parentElement;
    if (parent) {
      const poster = parent.querySelector('img');
      if (poster) {
        poster.style.transition = 'opacity 150ms ease';
        poster.style.opacity = '1';
      }
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.remove();
    activeIndexRef.current = null;
  }, []);

  // Set up IntersectionObserver
  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0) return;

    dbg('W:AUTO', 'WatchAutoplay mounted, posts:', posts.length);

    // Disconnect previous observer
    observerRef.current?.disconnect();

    const ratioMap = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.watchIndex);
          if (isNaN(idx)) continue;

          dbg('W:AUTO', 'IO fired, index:', idx, 'ratio:', entry.intersectionRatio.toFixed(2));

          if (entry.intersectionRatio < 0.2) {
            ratioMap.delete(idx);
            if (activeIndexRef.current === idx) {
              detachCurrent();
            }
          } else if (entry.intersectionRatio >= 0.6) {
            ratioMap.set(idx, entry.intersectionRatio);
          }
        }

        // Find best candidate
        let bestIdx = -1;
        let bestRatio = 0;
        for (const [idx, ratio] of ratioMap) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        }

        if (bestIdx >= 0 && bestIdx !== activeIndexRef.current) {
          detachCurrent();
          attachToTile(bestIdx);
        }
      },
      { threshold: [0, 0.2, 0.6, 1.0] }
    );

    // Observe only autoplay-eligible tiles
    const tiles = grid.querySelectorAll('[data-watch-index]');
    tiles.forEach((tile) => {
      const idx = Number((tile as HTMLElement).dataset.watchIndex);
      if (isAutoplayTile(idx)) {
        observer.observe(tile);
      }
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [posts, gridRef, isSlowNetwork, attachToTile, detachCurrent]);

  return null; // No visible UI — manages a single video element imperatively
};

export default WatchAutoplay;
