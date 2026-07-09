import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { useFullscreenFeedStore, useIsViewerOwnedBy } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import WatchTile from './WatchTile';
import WatchGridSkeleton from './WatchGridSkeleton';
import WatchEmptyState from './shared/WatchEmptyState';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';

interface WatchGridProps {
  posts: FeedPost[];
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch?: () => void;
  gridRef: React.RefObject<HTMLDivElement>;
  userId?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void; icon?: 'clear' | 'back' };
  /** Fired once the first visible row of tiles has decoded and painted. */
  onFirstRowDecoded?: () => void;
}


const GAP = 1;
const COLS = 2;
const FALLBACK_RATIO = 9 / 16; // width / height for default 9:16 tile
const RADIUS = 0;

function cornerRadius(ci: number) {
  const left = ci === 0;
  return {
    borderTopLeftRadius: left ? 0 : RADIUS,
    borderBottomLeftRadius: left ? 0 : RADIUS,
    borderTopRightRadius: left ? RADIUS : 0,
    borderBottomRightRadius: left ? RADIUS : 0,
  };
}

interface PlacedTile {
  post: FeedPost;
  index: number;
  ratio: number; // width / height
}

const WatchGrid: React.FC<WatchGridProps> = ({
  posts,
  isLoading,
  isFetching = false,
  isError,

  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  gridRef,
  emptyTitle = 'No clips yet',
  emptyMessage = 'This is where short golf clips will show up. Check back soon — there’s more on the way.',
  emptyAction,
  onFirstRowDecoded,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const decodedCountRef = useRef(0);
  const firedRef = useRef(false);
  const { activeIndices, railRef: autoplayRef } = useWatchAutoplay({ railId: 'watch-grid', posts, maxActive: 3 });
  const setGridRef = useCallback((el: HTMLDivElement | null) => {
    autoplayRef(el);
    if (gridRef) (gridRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [autoplayRef, gridRef]);


  // Reset the first-row-decoded latch whenever the underlying post set
  // fundamentally changes (mood/category switch → fresh page ready gate).
  useEffect(() => {
    decodedCountRef.current = 0;
    firedRef.current = false;
  }, [posts.length === 0 ? 0 : posts[0]?.id]);

  const handleTileDecoded = useCallback(() => {
    if (firedRef.current) return;
    decodedCountRef.current += 1;
    const target = Math.min(COLS, posts.length);
    if (target > 0 && decodedCountRef.current >= target) {
      firedRef.current = true;
      onFirstRowDecoded?.();
      // Phase 6: post-reveal idle prefetch of page 2 — network is quiet after
      // the first row paints. Skip on Save-Data; page 2 must not already be
      // in-flight or absent. requestIdleCallback keeps it off the main path.
      try {
        const conn: any = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
        if (conn?.saveData) return;
        if (!hasNextPage || isFetchingNextPage) return;
        const ric: any = (typeof window !== 'undefined' && (window as any).requestIdleCallback)
          || ((cb: () => void) => setTimeout(cb, 800));
        ric(() => {
          if (document.visibilityState !== 'visible') return;
          if (!hasNextPage || isFetchingNextPage) return;
          fetchNextPage();
        }, { timeout: 3000 });
      } catch { /* noop */ }
    }
  }, [posts.length, onFirstRowDecoded, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite scroll via IntersectionObserver.
  // Phase 6: rootMargin tiers by connection quality — 4g gets more lookahead
  // (600px), 3g gets less (200px), Save-Data pulls it to the sentinel (0px).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const conn: any = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    let rootMargin = '400px';
    if (conn?.saveData) rootMargin = '0px';
    else if (conn?.effectiveType === '4g') rootMargin = '600px';
    else if (conn?.effectiveType === '3g') rootMargin = '200px';

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync new posts into fullscreen overlay — only when THIS surface owns it.
  const isViewerOwnedByWatch = useIsViewerOwnedBy('watch');
  const appendPosts = useFullscreenFeedStore((s) => s.appendPosts);

  useEffect(() => {
    if (!isViewerOwnedByWatch) return;
    if (posts.length > 0) {
      appendPosts(posts);
    }
  }, [posts.length, isViewerOwnedByWatch, appendPosts, posts]);


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

  if ((isLoading || isFetching) && posts.length === 0) {
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
      <WatchEmptyState
        title={emptyTitle}
        message={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      <div
        ref={setGridRef}

        style={{
          display: 'flex',
          gap: GAP,
          alignItems: 'flex-start',
          paddingInline: 0,
          marginTop: 8,
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
                data-watch-tile-index={index}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: `${ratio}`,
                  ...cornerRadius(ci),
                  overflow: 'hidden',
                }}
              >
                <WatchTile
                  post={post}
                  index={index}
                  allPosts={posts}
                  onDecoded={index < COLS ? handleTileDecoded : undefined}
                  isAutoplayActive={activeIndices.has(index)}
                />


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
                borderRadius: RADIUS,
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
