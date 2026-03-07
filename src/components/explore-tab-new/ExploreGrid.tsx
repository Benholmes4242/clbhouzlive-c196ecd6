import { useRef, useEffect, useCallback, type RefObject } from 'react';
import { useInView } from 'react-intersection-observer';
import type { FeedPost } from '@/components/media-system/types/media';
import { ExploreTile } from './ExploreTile';
import ExploreGridSkeleton from './ExploreGridSkeleton';
import { ReviewsOfTheWeekStrip } from './ReviewsOfTheWeekStrip';

const REVIEWS_STRIP_AFTER = 18; // Insert after 18th tile (index 17)

interface ExploreGridProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  gridRef?: RefObject<HTMLDivElement | null>;
}

export default function ExploreGrid({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  gridRef,
}: ExploreGridProps) {
  const fetchGuard = useRef(false);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '400px',
    threshold: 0,
  });

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || fetchGuard.current) return;
    fetchGuard.current = true;
    fetchNextPage();
    setTimeout(() => { fetchGuard.current = false; }, 300);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, loadMore]);

  if (isLoading) {
    return <ExploreGridSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-3xl">📡</span>
        <p className="text-muted-foreground text-sm">Something went wrong</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-3xl">🌍</span>
        <p className="text-foreground text-sm font-medium">Nothing to explore yet</p>
        <p className="text-muted-foreground text-xs text-center max-w-[240px]">
          Golf content from around the world will appear here
        </p>
      </div>
    );
  }

  const showReviewsStrip = posts.length >= REVIEWS_STRIP_AFTER;

  return (
    <>
      <div ref={gridRef} className="grid grid-cols-3 gap-[2px] px-[2px]">
        {posts.map((post, index) => {
          const tile = <ExploreTile key={post.id} post={post} index={index} />;

          // Insert ReviewsOfTheWeekStrip after the 18th tile
          if (showReviewsStrip && index === REVIEWS_STRIP_AFTER - 1) {
            return (
              <>
                {tile}
                <ReviewsOfTheWeekStrip key="__reviews_strip" />
              </>
            );
          }

          return tile;
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
        </div>
      )}
    </>
  );
}
