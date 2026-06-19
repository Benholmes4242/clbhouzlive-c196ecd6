import React, { useMemo, useRef, useEffect } from 'react';
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
  emptyEmoji?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}

const GAP = 8;
const COLS = 2;
const FALLBACK_RATIO = 9 / 16; // width / height for default 9:16 tile

interface PlacedTile {
  post: FeedPost;
  index: number;
  ratio: number; // width / height
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
  emptyEmoji = '⛳',
  emptyTitle = 'No shorts yet',
  emptyMessage = 'Check back soon for new content',
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

  // Distribute tiles across COLS by shortest-column algorithm.
  // Each column holds normalised heights (height ÷ columnWidth), so columns
  // compare like-for-like regardless of actual column pixel width.
  const columns = useMemo<PlacedTile[][]>(() => {
    const cols: PlacedTile[][] = Array.from({ length: COLS }, () => []);
    const heights = new Array(COLS).fill(0);
    posts.forEach((post, i) => {
      const w = post.mediaItems?.[0]?.width;
      const h = post.mediaItems?.[0]?.height;
      const ratio = w && h && w > 0 && h > 0 ? w / h : FALLBACK_RATIO;
      // normalised tile height when column width = 1
      const tileH = 1 / ratio;
      // Find the shortest column
      let target = 0;
      for (let c = 1; c < COLS; c++) {
        if (heights[c] < heights[target]) target = c;
      }
      cols[target].push({ post, index: i, ratio });
      heights[target] += tileH;
    });
    return cols;
  }, [posts]);

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
        <span className="text-[48px]">{emptyEmoji}</span>
        <p className="mt-3 text-base font-semibold text-foreground">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={gridRef}
        style={{
          display: 'flex',
          gap: GAP,
          alignItems: 'flex-start',
          paddingInline: 0,
        }}
      >
        {columns.map((col, ci) => (
          <div
            key={ci}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: GAP,
            }}
          >
            {col.map(({ post, index, ratio }) => (
              <div
                key={post.id}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: `${ratio}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <WatchTile post={post} index={index} allPosts={posts} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} style={{ height: 1, width: '100%' }} />

      {isFetchingNextPage && (
        <div style={{ display: 'flex', gap: GAP, marginTop: GAP }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                aspectRatio: '9 / 16',
                borderRadius: 10,
                background:
                  'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default WatchGrid;
