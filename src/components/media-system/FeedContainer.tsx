/**
 * FeedContainer — vertical scroll-snap container for the media feed.
 * Includes gesture tracking for iOS autoplay and infinite scroll trigger.
 */
import { useState, useCallback, useEffect } from 'react';
import { FeedItem } from './FeedItem';
import { useViewportObserver } from './hooks/useViewportObserver';
import { useMediaStore } from './store/mediaStore';
import { useVideoPoolContext } from './VideoPoolProvider';
import type { FeedPost } from './types/media';

interface FeedContainerProps {
  posts: FeedPost[];
  onNearEnd?: () => void;
}

export function FeedContainer({ posts, onNearEnd }: FeedContainerProps) {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);

  const activeIndex = useMediaStore((s) => s.activeIndex);
  const setActiveIndex = useMediaStore((s) => s.setActiveIndex);
  const pool = useVideoPoolContext();

  const handleActiveChange = useCallback(
    (index: number) => {
      setActiveIndex(index);
      // Reset the new post's carousel to first item
      useMediaStore.getState().setCarouselPosition(index, 0);
    },
    [setActiveIndex]
  );

  const { observe, unobserve } = useViewportObserver(containerEl, handleActiveChange);

  // Infinite scroll: trigger when 3 items from end
  useEffect(() => {
    if (onNearEnd && activeIndex >= posts.length - 3 && posts.length > 0) {
      onNearEnd();
    }
  }, [activeIndex, posts.length, onNearEnd]);

  // iOS gesture priming: touchend gives us autoplay context
  useEffect(() => {
    if (!containerEl) return;

    const onTouchEnd = () => {
      const currentActiveIndex = useMediaStore.getState().activeIndex;
      const activePost = posts[currentActiveIndex];
      if (!activePost) return;

      const activeUrl = activePost.mediaItems?.[0]?.hlsUrl;
      if (!activeUrl) return;

      const video = pool.getElement(activeUrl);
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    };

    containerEl.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => containerEl.removeEventListener('touchend', onTouchEnd);
  }, [containerEl, posts, pool]);

  return (
    <div
      ref={containerCallbackRef}
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
