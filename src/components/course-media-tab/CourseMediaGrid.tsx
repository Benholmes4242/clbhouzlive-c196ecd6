import React, { forwardRef, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { CourseMediaTile } from './CourseMediaTile';
import { CourseMediaLandscapeCard } from './CourseMediaLandscapeCard';
import { CourseMediaGridSkeleton } from './CourseMediaGridSkeleton';

interface CourseMediaGridProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  courseName?: string;
}

function isLandscape(post: FeedPost): boolean {
  const firstMedia = post.mediaItems[0];
  if (!firstMedia) return false;
  return firstMedia.width > firstMedia.height;
}

export const CourseMediaGrid = forwardRef<HTMLDivElement, CourseMediaGridProps>(({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  courseName,
}, ref) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <CourseMediaGridSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-muted-foreground">Something went wrong</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-foreground text-background"
        >
          Retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 px-8 text-center">
        <p className="text-sm text-muted-foreground">
          No media yet — Be the first to share a photo or video from {courseName || 'this course'}
        </p>
      </div>
    );
  }

  // Build grid items — landscape posts get rendered as full-width cards
  let tileIndex = 0;

  return (
    <div ref={ref} className="grid grid-cols-3 gap-[2px]">
      {posts.map((post) => {
        const mediaKey = post.mediaItems[0]?.id || post.id;
        if (isLandscape(post)) {
          const idx = tileIndex++;
          return (
            <CourseMediaLandscapeCard
              key={mediaKey}
              post={post}
              index={idx}
              allPosts={posts}
            />
          );
        }
        const idx = tileIndex++;
        return (
          <CourseMediaTile
            key={mediaKey}
            post={post}
            index={idx}
            allPosts={posts}
          />
        );
      })}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="col-span-3 h-1" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="col-span-3 flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
});

CourseMediaGrid.displayName = 'CourseMediaGrid';
