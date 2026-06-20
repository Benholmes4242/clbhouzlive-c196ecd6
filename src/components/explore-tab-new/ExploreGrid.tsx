import { useRef, useEffect, useCallback, useMemo, type RefObject } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { ExploreTile } from './ExploreTile';
import ExploreGridSkeleton from './ExploreGridSkeleton';

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

const GAP = 2;
const COLS = 3;
const RADIUS = 6;
const FALLBACK_RATIO = 1; // square fallback for courses grid

function cornerRadius(ci: number) {
  const isLeft = ci === 0;
  const isRight = ci === COLS - 1;
  return {
    borderTopLeftRadius: isLeft ? 0 : RADIUS,
    borderBottomLeftRadius: isLeft ? 0 : RADIUS,
    borderTopRightRadius: isRight ? 0 : RADIUS,
    borderBottomRightRadius: isRight ? 0 : RADIUS,
  };
}

interface PlacedTile {
  post: FeedPost;
  index: number;
  ratio: number;
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

  const [heroPost, ...restPosts] = coursePosts;

  // Shortest-column masonry distribution for the rest (hero is rendered separately).
  const columns = useMemo<PlacedTile[][]>(() => {
    const cols: PlacedTile[][] = Array.from({ length: COLS }, () => []);
    const heights = new Array(COLS).fill(0);
    restPosts.forEach((post, i) => {
      const w = post.mediaItems?.[0]?.width;
      const h = post.mediaItems?.[0]?.height;
      const ratio = w && h && w > 0 && h > 0 ? w / h : FALLBACK_RATIO;
      const tileH = 1 / ratio;
      let target = 0;
      for (let c = 1; c < COLS; c++) {
        if (heights[c] < heights[target]) target = c;
      }
      // heroPost takes index 0; rest are 1..n
      cols[target].push({ post, index: i + 1, ratio });
      heights[target] += tileH;
    });
    return cols;
  }, [restPosts]);

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
    <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
      {heroPost && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden' }}>
          <ExploreTile
            post={heroPost}
            index={0}
            variant="hero"
            allPosts={coursePosts}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: GAP,
          alignItems: 'flex-start',
          paddingInline: 0,
          marginTop: heroPost ? 0 : 8,
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
                key={post.mediaItems[0]?.id || post.id}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: `${ratio}`,
                  ...cornerRadius(ci),
                  overflow: 'hidden',
                }}
              >
                <ExploreTile
                  post={post}
                  index={index}
                  allPosts={coursePosts}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} style={{ height: 1, width: '100%' }} />

      {isFetchingNextPage && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" />
        </div>
      )}
    </div>
  );
}
