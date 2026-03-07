import { useEffect, useRef, useCallback, type RefObject } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

const ELIGIBLE_INTERVAL = 6;

interface ExploreAutoplayProps {
  posts: FeedPost[];
  gridRef: RefObject<HTMLDivElement | null>;
}

function isSlowNetwork(): boolean {
  const conn = (navigator as any).connection;
  if (!conn) return false;
  const ect = conn.effectiveType;
  return ect === '2g' || ect === 'slow-2g';
}

export default function ExploreAutoplay({ posts, gridRef }: ExploreAutoplayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const currentIndexRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const attach = useCallback((tile: HTMLElement, post: FeedPost) => {
    const video = videoRef.current;
    if (!video) return;

    const media = post.mediaItems[0];
    if (!media || media.type !== 'video') return;

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
    if (!hlsUrl) {
      // No HLS, use MP4 directly
      if (mp4Fallback) {
        video.src = mp4Fallback;
        video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 play failed:', e.message));
      }
      return;
    }

    const isNativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isNativeHls) {
      video.src = hlsUrl;
      video.play().catch((e) => console.warn('[ExploreAutoplay] play failed:', e.message));
      return;
    }

    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        if (mp4Fallback) {
          video.src = mp4Fallback;
          video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 play failed:', e.message));
        }
        return;
      }

      const hls = new Hls({
        startLevel: 0,
        maxBufferLength: 5,
        maxMaxBufferLength: 10,
      });

      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        hls.currentLevel = 0;
        video.play().catch((e) => console.warn('[ExploreAutoplay] play failed:', e.message));
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          console.warn('[ExploreAutoplay] HLS fatal error, trying MP4 fallback');
          hls.destroy();
          hlsRef.current = null;
          if (mp4Fallback) {
            video.src = mp4Fallback;
            video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 fallback play failed:', e.message));
          }
        }
      });
    }).catch(() => {
      if (mp4Fallback) {
        video.src = mp4Fallback;
        video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 play failed:', e.message));
      }
    });
  }, []);

  const detach = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.style.opacity = '0';
    video.removeAttribute('src');
    video.load();

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Remove from DOM parent
    if (video.parentElement) {
      video.parentElement.removeChild(video);
    }

    currentIndexRef.current = null;
  }, []);

  // Create video element once
  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    videoRef.current = video;

    return () => {
      detach();
      videoRef.current = null;
    };
  }, [detach]);

  // Set up IntersectionObserver
  useEffect(() => {
    if (isSlowNetwork()) return;

    const grid = gridRef.current;
    if (!grid || posts.length === 0) return;

    // Clean up previous observer
    observerRef.current?.disconnect();

    const visibilityMap = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const idx = parseInt(el.dataset.exploreIndex ?? '', 10);
          if (isNaN(idx)) continue;
          visibilityMap.set(idx, entry.intersectionRatio);
        }

        // Find most visible eligible tile
        let bestIdx = -1;
        let bestRatio = 0;
        for (const [idx, ratio] of visibilityMap) {
          if (idx % ELIGIBLE_INTERVAL !== 0) continue;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        }

        // Detach if current tile is <20% visible
        if (currentIndexRef.current !== null) {
          const currentRatio = visibilityMap.get(currentIndexRef.current) ?? 0;
          if (currentRatio < 0.2) {
            detach();
          }
        }

        // Attach to best eligible if >=60% visible and different from current
        if (bestIdx >= 0 && bestRatio >= 0.6 && bestIdx !== currentIndexRef.current) {
          detach();

          const tile = grid.querySelector(`[data-explore-index="${bestIdx}"]`) as HTMLElement | null;
          const post = posts[bestIdx];
          if (tile && post && post.mediaItems[0]?.type === 'video') {
            currentIndexRef.current = bestIdx;
            attach(tile, post);
          }
        }
      },
      { threshold: [0, 0.2, 0.6, 1.0] }
    );

    observerRef.current = observer;

    // Observe all eligible tiles
    const tiles = grid.querySelectorAll('[data-explore-index]');
    tiles.forEach((tile) => {
      const idx = parseInt((tile as HTMLElement).dataset.exploreIndex ?? '', 10);
      if (!isNaN(idx) && idx % ELIGIBLE_INTERVAL === 0) {
        observer.observe(tile);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [posts, gridRef, attach, detach]);

  return null;
}
