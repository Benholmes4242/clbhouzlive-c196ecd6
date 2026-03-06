import { useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

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

  const isSlowNetwork = useCallback(() => {
    const connection = (navigator as any).connection;
    const type = connection?.effectiveType || '4g';
    return type === '2g' || type === 'slow-2g';
  }, []);

  useEffect(() => {
    if (isSlowNetwork()) return;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute('webkit-playsinline', '');
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;';
    videoRef.current = video;

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.remove();
      videoRef.current = null;
    };
  }, [isSlowNetwork]);

  const attachToTile = useCallback(async (index: number) => {
    const grid = gridRef.current;
    const video = videoRef.current;
    if (!grid || !video || isSlowNetwork()) return;

    const tile = grid.querySelector(`[data-watch-index="${index}"]`) as HTMLElement | null;
    if (!tile) return;

    const post = posts[index];
    const hlsUrl = post?.mediaItems[0]?.hlsUrl;
    if (!hlsUrl) return;

    video.pause();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    tile.appendChild(video);
    activeIndexRef.current = index;

    const { default: Hls } = await import('hls.js');
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

    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      hls.currentLevel = 0;
      // @ts-ignore
      hls.autoLevelEnabled = false;
      console.log('[WatchAutoplay] MANIFEST_PARSED, calling play() for index:', index);
      video.play().then(() => {
        console.log('[WatchAutoplay] play() SUCCESS for index:', index);
      }).catch((err) => {
        console.warn('[WatchAutoplay] play() FAILED for index:', index, err?.name, err?.message);
      });
    });

    const onCanPlay = () => {
      console.log('[WatchAutoplay] canplay fired, video.paused:', video.paused, 'index:', index);
      const poster = tile.querySelector('img');
      if (poster) {
        poster.style.transition = 'opacity 200ms ease';
        poster.style.opacity = '0';
      }
      if (video.paused) {
        video.play().catch(() => {});
      }
    };
    video.addEventListener('canplay', onCanPlay, { once: true });

    hlsRef.current = hls;
  }, [posts, gridRef, isSlowNetwork]);

  const detachCurrent = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    
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

  useEffect(() => {
    if (isSlowNetwork()) return;
    const grid = gridRef.current;
    if (!grid || posts.length === 0) return;

    observerRef.current?.disconnect();

    const ratioMap = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.watchIndex);
          if (isNaN(idx)) continue;

          if (entry.intersectionRatio < 0.2) {
            ratioMap.delete(idx);
            if (activeIndexRef.current === idx) {
              detachCurrent();
            }
          } else if (entry.intersectionRatio >= 0.6) {
            ratioMap.set(idx, entry.intersectionRatio);
          }
        }

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

  return null;
};

export default WatchAutoplay;