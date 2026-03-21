import { useRef, useEffect, useCallback, type RefObject } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useInView } from 'react-intersection-observer';
import type { FeedPost } from '@/components/media-system/types/media';
import { ExploreTile } from './ExploreTile';
import ExploreGridSkeleton from './ExploreGridSkeleton';
import { FeaturedRegionHero } from './FeaturedRegionHero';
import { TrendingCoursesStrip } from './TrendingCoursesStrip';
import { ExploreRegionsStrip } from './ExploreRegionsStrip';
import { ReviewsOfTheWeekStrip } from './ReviewsOfTheWeekStrip';

const TRENDING_AFTER = 6;
const REGIONS_AFTER = 18;

interface ExploreGridProps {
  posts: FeedPost[];
  coursePosts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  gridRef?: RefObject<HTMLDivElement | null>;
  activeRegion: string | null;
  onRegionChange: (slug: string | null) => void;
}

export default function ExploreGrid({
  posts,
  coursePosts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  gridRef,
  activeRegion,
  onRegionChange,
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

  // Sync new posts into fullscreen overlay
  const isFullscreenOpen = false; // TODO Brief 3
  const fullscreenPostCount = 0; // TODO Brief 3

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (coursePosts.length > fullscreenPostCount) {
      const newPosts = coursePosts.slice(fullscreenPostCount);
      // TODO Brief 3: appendPosts(newPosts);
    }
  }, [coursePosts.length, isFullscreenOpen, fullscreenPostCount]);

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

  if (coursePosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-3xl">🏌️</span>
        <p className="text-foreground text-sm font-medium">No course content yet</p>
        <p className="text-muted-foreground text-xs text-center max-w-[240px]">
          Content tagged at golf courses will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Discovery modules above the grid */}
      <FeaturedRegionHero
        onRegionSelect={(slug) => onRegionChange(slug)}
        activeRegion={activeRegion}
      />
      <ReviewsOfTheWeekStrip activeRegion={activeRegion} />

      {/* Grid */}
      <div ref={gridRef} className="grid grid-cols-2 gap-[2px] px-[2px]">
        {coursePosts.map((post, index) => (
          <div className="contents" key={post.id}>
            <ExploreTile
              post={post}
              index={index}
              allPosts={coursePosts}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />

            {index === TRENDING_AFTER - 1 && (
              <TrendingCoursesStrip activeRegion={activeRegion} />
            )}

            {index === REGIONS_AFTER - 1 && activeRegion === null && (
              <ExploreRegionsStrip
                onRegionSelect={(slug) => onRegionChange(slug)}
                activeRegion={activeRegion}
              />
            )}
          </div>
        ))}
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
