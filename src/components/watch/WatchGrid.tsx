import React, { useRef, useEffect } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import WatchTile from './WatchTile';
import WatchGridSkeleton from './WatchGridSkeleton';

interface WatchGridProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError?: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch?: () => void;
  gridRef: React.RefObject<HTMLDivElement>;
  userId?: string;
}

const WatchGrid: React.FC<WatchGridProps> = ({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  gridRef,
  userId,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync new posts into fullscreen overlay
  const { isOpen: isFullscreenOpen, appendPosts } = useFullscreenFeedStore();

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (posts.length > 0) {
      appendPosts(posts);
    }
  }, [posts.length, isFullscreenOpen, appendPosts]);

  if (isLoading && posts.length === 0) {
    return <WatchGridSkeleton />;
  }

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <span className="text-[48px]">📡</span>
        <p className="mt-3 text-base font-semibold text-foreground">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again</p>
        {refetch && (
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 rounded-full text-sm font-semibold bg-foreground text-background"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <span className="text-[48px]">⛳</span>
        <p className="mt-3 text-base font-semibold text-foreground">No shorts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Check back soon for new content</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-[3px] pt-1"
      >
        {posts.map((post, i) => (
          <div key={post.id}>
            <WatchTile
              post={post}
              index={i}
              allPosts={posts}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="grid grid-cols-2 gap-[3px] mt-[3px]">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-[4px] animate-[shimmer_1.5s_infinite]"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default WatchGrid;