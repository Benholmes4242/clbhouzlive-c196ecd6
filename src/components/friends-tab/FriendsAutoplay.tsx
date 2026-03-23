import { useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { attachHlsToTile, prefetchTile } from '@/hooks/useTileVideoPlayer';

const POOL_SIZE = 2;
const ATTACH_THRESHOLD = 0.6;
const DETACH_THRESHOLD = 0.2;

function isSlowNetwork(): boolean {
  const conn = (navigator as any).connection;
  if (!conn) return false;
  const ect = conn.effectiveType;
  return ect === '2g' || ect === 'slow-2g';
}

interface FriendsAutoplayProps {
  posts: FeedPost[];
  feedRef: React.RefObject<HTMLElement>;
}

export function FriendsAutoplay({ posts, feedRef }: FriendsAutoplayProps) {
  const poolRef = useRef<HTMLVideoElement[]>([]);
  const hlsRefs = useRef<(any | null)[]>([null, null]);
  const activeMapRef = useRef<Map<number, number>>(new Map()); // slot → cardIndex
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedCountRef = useRef<number>(0);

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

    if ((video as any)._friendsCanPlayHandler) {
      video.removeEventListener('canplay', (video as any)._friendsCanPlayHandler);
      (video as any)._friendsCanPlayHandler = null;
    }

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

  const attachToCard = useCallback(async (slot: number, cardIndex: number, post: FeedPost, mediaEl: HTMLElement) => {
    const video = poolRef.current[slot];
    if (!video) return;

    const media = post.mediaItems[0];
    if (!media) return;

    const hlsUrl = media.hlsUrl;
    const mp4Fallback = media.mp4Url;
    if (!hlsUrl && !mp4Fallback) return;

    // Position video over media area
    video.style.position = 'absolute';
    video.style.inset = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.opacity = '0';
    video.style.transition = 'opacity 200ms ease';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '1';
    video.style.borderRadius = 'inherit';
    mediaEl.appendChild(video);

    const onCanPlay = () => { video.style.opacity = '1'; };
    video.addEventListener('canplay', onCanPlay, { once: true });
    (video as any)._friendsCanPlayHandler = onCanPlay;

    try {
      const hls = await attachHlsToTile({
        hlsUrl: hlsUrl || '',
        mp4Fallback: mp4Fallback || undefined,
        video,
      });
      hlsRefs.current[slot] = hls;
    } catch { /* silent */ }
  }, []);

  // Main IO observer
  useEffect(() => {
    if (isSlowNetwork()) return;

    const feed = feedRef.current;
    if (!feed || posts.length === 0) return;

    observerRef.current?.disconnect();

    const visibilityMap = new Map();

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const idx = parseInt(el.dataset.cardIndex ?? '', 10);
        if (isNaN(idx)) continue;
        visibilityMap.set(idx, entry.intersectionRatio);
      }

      // Find most visible video card
      let bestIdx = -1;
      let bestRatio = 0;
      for (const [idx, ratio] of visibilityMap) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIdx = idx;
        }
      }

      // Detach slots whose card dropped below threshold
      for (const [slot, cardIdx] of activeMapRef.current) {
        const ratio = visibilityMap.get(cardIdx) ?? 0;
        if (ratio < DETACH_THRESHOLD) {
          activeMapRef.current.delete(slot);
          detachSlot(slot);
        }
      }

      // Attach best visible video card to a free slot
      if (bestIdx >= 0 && bestRatio >= ATTACH_THRESHOLD) {
        const alreadyActive = [...activeMapRef.current.values()].includes(bestIdx);
        if (!alreadyActive) {
          let freeSlot = -1;
          for (let s = 0; s < POOL_SIZE; s++) {
            if (!activeMapRef.current.has(s)) { freeSlot = s; break; }
          }
          if (freeSlot === -1) {
            const evictSlot = 0;
            activeMapRef.current.delete(evictSlot);
            detachSlot(evictSlot);
            freeSlot = evictSlot;
          }

          const cardEl = feed.querySelector(`[data-card-index="${bestIdx}"]`) as HTMLElement | null;
          const post = posts[bestIdx];
          const media = post?.mediaItems?.[0];

          if (cardEl && post && media && (media.hlsUrl || media.mp4Url)) {
            // Find the media wrapper inside the card
            const mediaEl = cardEl.querySelector('[data-media-wrapper]') as HTMLElement | null;
            if (mediaEl) {
              activeMapRef.current.set(freeSlot, bestIdx);
              attachToCard(freeSlot, bestIdx, post, mediaEl);
            }
          }
        }
      }
    }, { threshold: [0, DETACH_THRESHOLD, ATTACH_THRESHOLD, 1.0] });

    observerRef.current = observer;

    // Observe only video cards
    const cards = feed.querySelectorAll('[data-card-index]');
    cards.forEach((card) => {
      const idx = parseInt((card as HTMLElement).dataset.cardIndex ?? '', 10);
      if (isNaN(idx)) return;
      const media = posts[idx]?.mediaItems?.[0];
      if (media?.hlsUrl || media?.mp4Url) {
        observer.observe(card);
      }
    });

    observedCountRef.current = posts.length;

    return () => { observer.disconnect(); };
  }, [posts, feedRef, attachToCard, detachSlot]);

  // Re-observe new cards on infinite scroll
  useEffect(() => {
    if (posts.length <= observedCountRef.current) return;
    const feed = feedRef.current;
    const observer = observerRef.current;
    if (!feed || !observer) return;

    const cards = feed.querySelectorAll('[data-card-index]');
    cards.forEach((card) => {
      const idx = parseInt((card as HTMLElement).dataset.cardIndex ?? '', 10);
      if (isNaN(idx) || idx < observedCountRef.current) return;
      const media = posts[idx]?.mediaItems?.[0];
      if (media?.hlsUrl || media?.mp4Url) {
        observer.observe(card);
      }
    });

    observedCountRef.current = posts.length;
  }, [posts.length, feedRef]);

  return null;
}
