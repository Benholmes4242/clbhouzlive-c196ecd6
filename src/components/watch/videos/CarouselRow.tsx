import { useEffect, useRef, useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import AutoplayVideoCard from './AutoplayVideoCard';
import { prefetchTile } from '@/hooks/useTileVideoPlayer';

interface CarouselRowProps {
  items: FeedPost[];
  allPosts: FeedPost[];
  baseIndex: number; // index offset into allPosts for tap → fullscreen
  userId?: string;
}

export default function CarouselRow({ items, allPosts, baseIndex, userId }: CarouselRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect which card is most-centred within the scroller
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
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

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    compute();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
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
        {items.map((post, i) => (
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
              active={inView && i === activeIndex}
              metaPadX={0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
