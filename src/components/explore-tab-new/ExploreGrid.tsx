import { useRef, useEffect, useCallback, type RefObject } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { ExploreTile } from './ExploreTile';
import ExploreGridSkeleton from './ExploreGridSkeleton';
import { TrendingCoursesStrip } from './TrendingCoursesStrip';

const TRENDING_AFTER = 6;

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
  const { isOpen: isFullscreenOpen, appendPosts } = useFullscreenFeedStore();

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (coursePosts.length > 0) {
      appendPosts(coursePosts);
    }
  }, [coursePosts.length, isFullscreenOpen, appendPosts]);

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

  const [heroPost, ...restPosts] = coursePosts;
  let tileIndex = 0;

  return (
    <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {heroPost && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden' }}>
          <ExploreTile
            post={heroPost}
            index={tileIndex++}
            variant="hero"
            allPosts={coursePosts}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, gridAutoFlow: 'dense' }}>
        {restPosts.map((post, i) => {
          const idx = tileIndex++;
          const isFeature = i > 2 && i % 7 === 0;
          const showTrendingAfter = idx === TRENDING_AFTER - 1;
          return (
            <div key={post.mediaItems[0]?.id || post.id} style={{ display: 'contents' }}>
              <div
                style={
                  isFeature
                    ? { gridColumn: 'span 2', gridRow: 'span 2', position: 'relative', aspectRatio: '1 / 1' }
                    : { position: 'relative', aspectRatio: '1 / 1' }
                }
              >
                <ExploreTile
                  post={post}
                  index={idx}
                  feature={isFeature}
                  allPosts={coursePosts}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
              {showTrendingAfter && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <TrendingCoursesStrip activeRegion={activeRegion} />
                </div>
              )}
            </div>
          );
        })}

        <div ref={sentinelRef} style={{ gridColumn: '1 / -1', height: 1 }} />

        {isFetchingNextPage && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" />
          </div>
        )}
      </div>
    </div>
  );
}
