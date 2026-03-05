import React, { useRef, useEffect } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import WatchTile from './WatchTile';
import WatchGridSkeleton from './WatchGridSkeleton';

interface WatchGridProps {
  posts: FeedPost[];
  isLoading: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  gridRef: React.RefObject<HTMLDivElement>;
}

const WatchGrid: React.FC<WatchGridProps> = ({
  posts,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  gridRef,
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

  if (isLoading && posts.length === 0) {
    return <WatchGridSkeleton />;
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
          <WatchTile key={post.id} post={post} index={i} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && <WatchGridSkeleton />}
    </>
  );
};

export default WatchGrid;
