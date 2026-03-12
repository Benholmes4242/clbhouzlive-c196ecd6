import { useEffect, useRef, useCallback } from 'react';
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

async function prewarmVideo(hlsUrl: string, idx: number, seen: Set<number>) {
  if (seen.has(idx)) return;
  seen.add(idx);
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
  const prewarmedSetRef = useRef<Set<number>>(new Set());

  // Reset pre-warm set when feed changes
  useEffect(() => {
    prewarmedSetRef.current = new Set();
  }, [posts]);

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

      if (activeMapRef.current.get(slot) !== cardIndex) return;

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
        if (activeMapRef.current.get(slot) !== cardIndex) return;
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

              // Pre-warm next 2 video cards ahead
              const videoIndices = posts
                .map((p, i) => ({ i, hasVideo: !!(p.mediaItems?.[0]?.hlsUrl || p.mediaItems?.[0]?.mp4Url) }))
                .filter(p => p.hasVideo && p.i > bestIdx)
                .slice(0, 2)
                .map(p => p.i);

              for (const nextIdx of videoIndices) {
                const nextHlsUrl = posts[nextIdx]?.mediaItems?.[0]?.hlsUrl;
                if (nextHlsUrl) prewarmVideo(nextHlsUrl, nextIdx, prewarmedSetRef.current);
              }
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
