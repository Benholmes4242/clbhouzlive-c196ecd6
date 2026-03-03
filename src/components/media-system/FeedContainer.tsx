/**
 * FeedContainer — vertical scroll-snap container for the media feed.
 * Handles viewport observation and active item management.
 */
import { useRef, useCallback } from 'react';
import { FeedItem } from './FeedItem';
import { useViewportObserver } from './hooks/useViewportObserver';
import { useMediaStore } from './store/mediaStore';
import type { FeedPost } from './types/media';

interface FeedContainerProps {
  posts: FeedPost[];
}

export function FeedContainer({ posts }: FeedContainerProps) {
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

  return (
    <div
      ref={containerRef}
      className="w-full h-[100dvh] overflow-y-scroll bg-black"
      style={{
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .media-feed-container::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="media-feed-container">
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
    </div>
  );
}
