import { useEffect, useRef, useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import AutoplayVideoCard from './AutoplayVideoCard';
import { prefetchTile } from '@/hooks/useTileVideoPlayer';
import { MediaRuntime } from '@/media/runtime';
import type { RegisterMediaFn } from '@/media';

interface CarouselRowProps {
  items: FeedPost[];
  allPosts: FeedPost[];
  baseIndex: number; // index offset into allPosts for tap → fullscreen
  userId?: string;
  /** Phase WatchSpotlight-C: runtime-managed spotlight. */
  registerMedia: RegisterMediaFn;
  playingIds: Set<string>;
  visibleIds: Set<string>;
}

export default function CarouselRow({
  items,
  allPosts,
  baseIndex,
  userId,
  registerMedia,
  playingIds,
  visibleIds,
}: CarouselRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect which card is most-centred within the scroller
  // Gated to scroll-settle: activeIndex only commits once scrolling pauses
  // (native scrollend where available, else 150ms trailing-idle fallback).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const compute = () => {
      const rect = scroller.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(c - centerX);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      setActiveIndex((prev) => (prev !== bestIdx ? bestIdx : prev));
    };

    const scheduleSettle = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(compute, 150);
    };

    const onScroll = () => {
      scheduleSettle();
    };

    compute(); // initial commit on mount
    scroller.addEventListener('scroll', onScroll, { passive: true });
    const onScrollEnd = () => compute();
    scroller.addEventListener('scrollend', onScrollEnd, { passive: true });

    return () => {
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('scrollend', onScrollEnd);
      if (raf) cancelAnimationFrame(raf);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [items.length]);

  // Pause when the whole row is offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.1),
      { threshold: [0, 0.1, 0.5] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Prefetch the next card's hls when active changes
  useEffect(() => {
    const next = items[activeIndex + 1];
    const url = (next?.mediaItems?.find((m) => m.type === 'video') as any)?.hlsUrl;
    if (url) prefetchTile(url);
  }, [activeIndex, items]);

  // Phase WatchSpotlight-C: drive runtime candidacy from the debounced
  // centered index + row inView. All tiles in the row have ~equal vertical
  // visibility, so ratio-based IO would tie; we override with explicit
  // setCandidateState so the centered card always wins the spotlight.
  // The runtime's global 'watch' cap of 1 then enforces single playback
  // across the entire page (grid + rails compete).
  useEffect(() => {
    items.forEach((post, i) => {
      const id = `watch-rail-${post.id}`;
      const isCentered = inView && i === activeIndex;
      MediaRuntime.setCandidateState(id, {
        visible: isCentered,
        ratio: isCentered ? 1 : 0,
      });
    });
  }, [activeIndex, inView, items]);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef}>
      <div
        ref={scrollerRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          paddingInline: 16,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {items.map((post, i) => {
          const mediaId = `watch-rail-${post.id}`;
          return (
            <div
              key={post.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              style={{ flex: '0 0 72%', scrollSnapAlign: 'center' }}
            >
              <AutoplayVideoCard
                post={post}
                index={baseIndex + i}
                allPosts={allPosts}
                userId={userId}
                mediaId={mediaId}
                registerMedia={registerMedia}
                isPlaying={playingIds.has(mediaId)}
                isVisibleCandidate={visibleIds.has(mediaId)}
                sortIndex={baseIndex + i}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
