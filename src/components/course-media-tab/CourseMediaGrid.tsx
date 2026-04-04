import React, { forwardRef, useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
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
  const { isOpen: isFullscreenOpen, appendPosts } = useFullscreenFeedStore();

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (posts.length > 0) {
      appendPosts(posts);
    }
  }, [posts.length, isFullscreenOpen, appendPosts]);

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
      <div className="flex flex-col px-4 pt-8 pb-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">No photos or videos yet</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
              Help other golfers discover {courseName || 'this course'} — be the first to share your experience.
            </p>
          </div>
        </div>
        {/* Supporting tips card */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-4">
            What to share
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: '📸', label: 'Course views and signature holes' },
              { icon: '🎬', label: 'Short videos from your round' },
              { icon: '🏠', label: 'Clubhouse, facilities and atmosphere' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
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
