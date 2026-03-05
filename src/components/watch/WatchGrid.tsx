import React, { useCallback, useRef, useEffect } from 'react';
import { WatchTile } from './WatchTile';
import { WatchGridSkeleton } from './WatchGridSkeleton';
import type { FeedPost } from '@/components/media-system/types/media';
import { MapPin } from 'lucide-react';

interface WatchGridProps {
  posts: FeedPost[];
  isLoading: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onTileTap: (post: FeedPost, index: number) => void;
  emptyState?: React.ReactNode;
}

export function WatchGrid({
  posts,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onTileTap,
  emptyState,
}: WatchGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <WatchGridSkeleton />;
  }

  if (!isLoading && posts.length === 0) {
    return (
      emptyState || (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <span className="text-3xl mb-3">⛳</span>
          <p className="text-white/60 text-sm font-medium">No shorts found</p>
          <p className="text-white/30 text-xs mt-1">Check back later for new content</p>
        </div>
      )
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-[2px] px-[2px]">
        {posts.map((post, i) => (
          <WatchTile key={post.id} post={post} index={i} onTap={onTileTap} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && <WatchGridSkeleton />}
    </>
  );
}

/** Empty state for Near Me without location */
export function NearMeEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <MapPin className="w-8 h-8 text-white/30 mb-3" />
      <p className="text-white/60 text-sm font-medium">Set your home course to see nearby golf content</p>
      <p className="text-white/30 text-xs mt-1">Update your profile to enable location-based discovery</p>
    </div>
  );
}
