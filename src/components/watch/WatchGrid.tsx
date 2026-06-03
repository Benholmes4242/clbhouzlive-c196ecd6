import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import WatchTile from './WatchTile';
import WatchGridSkeleton from './WatchGridSkeleton';
import WatchActionSheet from './WatchActionSheet';

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
  emptyEmoji?: string;
  emptyTitle?: string;
  emptyMessage?: string;
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
  emptyEmoji = '⛳',
  emptyTitle = 'No shorts yet',
  emptyMessage = 'Check back soon for new content',
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Long-press action sheet state — lifted here so a single sheet serves all tiles
  // (and so the same wiring benefits both Watch and Clips surfaces).
  const [actionSheetPost, setActionSheetPost] = useState<FeedPost | null>(null);
  const handleLongPress = useCallback((post: FeedPost) => {
    setActionSheetPost(post);
  }, []);

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
      <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {posts[0] && (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden' }}>
            <WatchTile
              post={posts[0]}
              index={0}
              allPosts={posts}
              variant="hero"
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLongPress={handleLongPress}
            />
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            gridAutoFlow: 'dense',
          }}
        >
          {posts.slice(1).map((post, i) => {
            const isFeature = i > 2 && i % 7 === 0;
            return (
              <div
                key={post.id}
                style={
                  isFeature
                    ? { gridColumn: 'span 2', gridRow: 'span 2', position: 'relative', aspectRatio: '1 / 1' }
                    : { position: 'relative', aspectRatio: '1 / 1' }
                }
              >
                <WatchTile
                  post={post}
                  index={i + 1}
                  allPosts={posts}
                  variant="tile"
                  feature={isFeature}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onLongPress={handleLongPress}
                />
              </div>
            );
          })}
          <div ref={sentinelRef} style={{ gridColumn: '1 / -1', height: 1 }} />
        </div>
      </div>

      {isFetchingNextPage && (
        <div className="grid grid-cols-3 gap-[2px] mt-[2px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-square animate-[shimmer_1.5s_infinite]"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      )}


      <WatchActionSheet
        open={!!actionSheetPost}
        onOpenChange={(open) => { if (!open) setActionSheetPost(null); }}
        post={actionSheetPost}
        userId={userId}
      />
    </>
  );
};

export default WatchGrid;
