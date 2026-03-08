import React, { useRef, useEffect } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import WatchTile from './WatchTile';
import WatchGridSkeleton from './WatchGridSkeleton';
import SuggestedCreatorsStrip from './SuggestedCreatorsStrip';

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
  const prevPostCountRef = useRef(0);

  if (posts.length !== prevPostCountRef.current) {
    prevPostCountRef.current = posts.length;
  }

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
            className="mt-4 px-6 py-2 rounded-full text-sm font-semibold bg-foreground text-background active:scale-[0.96]"
            style={{ transition: 'transform 100ms ease' }}
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
        className="grid grid-cols-3 gap-[2px] px-[2px]"
      >
        {posts.map((post, i) => (
          <div key={post.id}>
            <WatchTile post={post} index={i} allPosts={posts} />
          </div>
        ))}
        {posts.length > 8 && <SuggestedCreatorsStrip userId={userId} />}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && <WatchGridSkeleton />}
    </>
  );
};

export default WatchGrid;
