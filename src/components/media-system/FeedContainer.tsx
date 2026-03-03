/**
 * FeedContainer — vertical scroll-snap container for the media feed.
 * Includes gesture tracking for iOS autoplay and infinite scroll trigger.
 */
import { useRef, useCallback, useEffect } from 'react';
import { FeedItem } from './FeedItem';
import { useViewportObserver } from './hooks/useViewportObserver';
import { useMediaStore } from './store/mediaStore';
import type { FeedPost } from './types/media';

interface FeedContainerProps {
  posts: FeedPost[];
  onNearEnd?: () => void;
}

export function FeedContainer({ posts, onNearEnd }: FeedContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = useMediaStore((s) => s.activeIndex);
  const setActiveIndex = useMediaStore((s) => s.setActiveIndex);

  const handleActiveChange = useCallback(
    (index: number) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  const { observe, unobserve } = useViewportObserver(containerRef, handleActiveChange);

  // Infinite scroll: trigger when 3 items from end
  useEffect(() => {
    if (onNearEnd && activeIndex >= posts.length - 3 && posts.length > 0) {
      onNearEnd();
    }
  }, [activeIndex, posts.length, onNearEnd]);

  // iOS gesture priming: touch events give us autoplay context
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchEnd = () => {
      // The touchend provides gesture context for iOS autoplay
      // The pool's safePlay handles the actual retry logic
    };

    container.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => container.removeEventListener('touchend', onTouchEnd);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[100dvh] overflow-y-scroll bg-black media-feed-scroller"
      style={{
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .media-feed-scroller::-webkit-scrollbar { display: none; }
      `}</style>
      {posts.map((post, index) => (
        <FeedItem
          key={post.id}
          post={post}
          index={index}
          isActive={index === activeIndex}
          observe={observe}
          unobserve={unobserve}
        />
      ))}
    </div>
  );
}
