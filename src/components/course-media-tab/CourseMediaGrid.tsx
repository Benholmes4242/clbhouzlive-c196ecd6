import React, { forwardRef, useEffect, useRef } from 'react';
import { AlertCircle, Camera, Loader2 } from 'lucide-react';
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

  // Sync new posts into fullscreen overlay
  // TODO Brief 3: const isFullscreenOpen = useFullscreenFeed(s => s.isOpen);
  // TODO Brief 3: const fullscreenPostCount = useFullscreenFeed(s => s.posts.length);

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (posts.length > fullscreenPostCount) {
      const newPosts = posts.slice(fullscreenPostCount);
      // TODO Brief 3: useFullscreenFeed.getState().appendPosts(newPosts);
    }
  }, [posts.length, isFullscreenOpen, fullscreenPostCount]);

  if (isLoading) return <CourseMediaGridSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="text-base font-semibold text-foreground">Couldn't load media</p>
        <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#f59e0b] text-white hover:bg-[#e8920f] active:scale-[0.97] transition-all min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 px-8 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-1">
          <Camera className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="text-base font-semibold text-foreground">No media yet</p>
        <p className="text-sm text-muted-foreground">
          Be the first to share a photo or video from {courseName || 'this course'}.
        </p>
      </div>
    );
  }

  let tileIndex = 0;

  return (
    <div ref={ref} className="grid grid-cols-2 gap-[2px] grid-flow-dense">
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
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
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
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        );
      })}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="col-span-2 h-1" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="col-span-2 flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" />
        </div>
      )}
    </div>
  );
});

CourseMediaGrid.displayName = 'CourseMediaGrid';
