import { useCallback, useRef } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import AutoplayVideoCard from './AutoplayVideoCard';
import { useEdgeFades } from '@/components/watch/shared/useEdgeFades';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';


interface CarouselRowProps {
  items: FeedPost[];
  allPosts: FeedPost[];
  baseIndex: number; // index offset into allPosts for tap → fullscreen
  userId?: string;
}

export default function CarouselRow({ items, allPosts, baseIndex, userId }: CarouselRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Engine-native activation: one hook, feed-model gates + hysteresis.
  const { activeIdx, railRef: autoplayRef } = useWatchAutoplay({ railId: 'videos-carousel-row' });
  const setScrollerRef = useCallback((el: HTMLDivElement | null) => {
    autoplayRef(el);
    scrollerRef.current = el;
  }, [autoplayRef]);


  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="hrail-edge-fade" style={{ position: 'relative' }}>
      <CarouselEdgeFadeBinding scrollerRef={scrollerRef} wrapperRef={containerRef} />
      <div
        ref={setScrollerRef}

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
            data-watch-tile-index={i}
            style={{ flex: '0 0 72%', scrollSnapAlign: 'center' }}
          >
            <AutoplayVideoCard
              post={post}
              index={baseIndex + i}
              allPosts={allPosts}
              userId={userId}
              active={activeIdx === i}
              metaPadX={0}
            />
          </div>
        ))}
      </div>

      <div
        aria-hidden
        className="hrail-fade hrail-fade-left"
        style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 5,
          pointerEvents: 'none',
          background: 'linear-gradient(to right, #F8FAFC 0%, rgba(248,250,252,0) 100%)',
          opacity: 0, transition: 'opacity 150ms ease',
        }}
      />
      <div
        aria-hidden
        className="hrail-fade hrail-fade-right"
        style={{
          position: 'absolute', top: 0, bottom: 0, right: 0, width: 5,
          pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(248,250,252,0) 0%, #F8FAFC 100%)',
          opacity: 0, transition: 'opacity 150ms ease',
        }}
      />
    </div>
  );
}

// Small binding component so we can call the hook without restructuring the parent.
function CarouselEdgeFadeBinding({
  scrollerRef,
  wrapperRef,
}: {
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  useEdgeFades(scrollerRef, wrapperRef);
  return null;
}
