import { useEffect, useRef, useCallback, type RefObject } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

const ELIGIBLE_INTERVAL = 6;

const perf = (tag: string, ...args: any[]) => {
  console.log(`[PERF:${tag}] ${Date.now() % 100000}`, ...args);
};

const prewarmedSet = new Set<number>();

const prewarmTile = async (hlsUrl: string, idx: number) => {
  if (prewarmedSet.has(idx)) return;
  prewarmedSet.add(idx);
  perf('EXPLORE', 'pre-warm START tileIndex:', idx);
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
        perf('EXPLORE', 'pre-warm init tileIndex:', idx);
        fetch(initUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
      }
    }

    const segLine = lines.find(l => l.trim() && !l.startsWith('#'));
    if (segLine) {
      const segUrl = segLine.trim().startsWith('http') ? segLine.trim() : new URL(segLine.trim(), base).href;
      perf('EXPLORE', 'pre-warm seg tileIndex:', idx);
      fetch(segUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
    }
  } catch { /* silent */ }
};

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

  const attach = useCallback((tile: HTMLElement, post: FeedPost, idx: number) => {
    const video = videoRef.current;
    if (!video) return;

    const media = post.mediaItems[0];
    if (!media || media.type !== 'video') return;

    const hlsUrl = media.hlsUrl;
    const mp4Fallback = media.mp4Url;
    if (!hlsUrl && !mp4Fallback) return;

    perf('EXPLORE', 'ATTACH tileIndex:', idx);

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
      perf('EXPLORE', 'CAN PLAY tileIndex:', idx, 'readyState:', video.readyState);
      video.style.opacity = '1';
      video.removeEventListener('canplay', onCanPlay);
    };
    video.addEventListener('canplay', onCanPlay);

    if (!hlsUrl) {
      if (mp4Fallback) {
        video.src = mp4Fallback;
        perf('EXPLORE', '<<< PLAYING tileIndex:', idx);
        video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 play failed:', e.message));
      }
      return;
    }

    const isNativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isNativeHls) {
      video.src = hlsUrl;
      perf('EXPLORE', '<<< PLAYING tileIndex:', idx);
      video.play().catch((e) => console.warn('[ExploreAutoplay] play failed:', e.message));
      return;
    }

    import('hls.js').then(async ({ default: Hls }) => {
      if (!Hls.isSupported()) {
        if (mp4Fallback) {
          video.src = mp4Fallback;
          perf('EXPLORE', '<<< PLAYING tileIndex:', idx);
          video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 play failed:', e.message));
        }
        return;
      }

      const { createCachedLoader } = await import('@/components/media-system/utils/cachedHlsLoader');

      const hls = new Hls({
        startLevel: 0,
        maxBufferLength: 5,
        maxMaxBufferLength: 10,
        enableWorker: true,
        loader: createCachedLoader(Hls),
      });

      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        perf('EXPLORE', 'MANIFEST_PARSED tileIndex:', idx);
        hls.currentLevel = 0;
        perf('EXPLORE', '<<< PLAYING tileIndex:', idx);
        video.play().catch((e) => console.warn('[ExploreAutoplay] play failed:', e.message));
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          console.warn('[ExploreAutoplay] HLS fatal error, trying MP4 fallback');
          hls.destroy();
          hlsRef.current = null;
          if (mp4Fallback) {
            video.src = mp4Fallback;
            perf('EXPLORE', '<<< PLAYING tileIndex:', idx);
            video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 fallback play failed:', e.message));
          }
        }
      });
    }).catch(() => {
      if (mp4Fallback) {
        video.src = mp4Fallback;
        perf('EXPLORE', '<<< PLAYING tileIndex:', idx);
        video.play().catch((e) => console.warn('[ExploreAutoplay] mp4 play failed:', e.message));
      }
    });
  }, []);

  const detach = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const idx = currentIndexRef.current;
    perf('EXPLORE', 'DETACH tileIndex:', idx);

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
          const eligibleMedia = post?.mediaItems?.[0];
          if (tile && post && eligibleMedia && (eligibleMedia.hlsUrl || eligibleMedia.mp4Url)) {
            currentIndexRef.current = bestIdx;
            attach(tile, post, bestIdx);

            // Pre-warm next 2 eligible tiles
            for (let i = 1; i <= 2; i++) {
              const nextIdx = bestIdx + (ELIGIBLE_INTERVAL * i);
              const nextPost = posts[nextIdx];
              const nextHlsUrl = nextPost?.mediaItems?.[0]?.hlsUrl;
              if (nextHlsUrl) prewarmTile(nextHlsUrl, nextIdx);
            }
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
