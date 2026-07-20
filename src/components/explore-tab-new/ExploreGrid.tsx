import { useRef, useEffect, useCallback, useMemo, type RefObject } from 'react';
// App-wide scroll container (#root, not window) — used by all infinite lists
const SCROLL_ROOT = typeof document !== 'undefined' ? document.getElementById('root') : null;
import { useFullscreenFeedStore, useIsViewerOwnedBy } from '@/store/fullscreenFeedStore';
import { useInView } from 'react-intersection-observer';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedPost } from '@/components/media-system/types/media';
import { FeedCard, type FeedCardRow } from '@/components/feed-cards/FeedCard';
import { packColumns } from '@/components/feed-cards/packColumns';
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

/**
 * FeedPost → FeedCardRow mapping (Brief U3R).
 *
 * Explore feeds emit FeedPost-shaped rows (no MixedGridRow RPC), so we
 * synthesize the row context FeedCard reads:
 *   - derived_format: prefers explicit media.format when present;
 *     otherwise `duration <= 90 ? 'clip' : 'video'` (falls back to
 *     'video' when duration is unknown).
 *   - post_content:  post.caption
 *   - poster_url:    mediaItem.thumbnailUrl ?? imageUrl
 *   - duration_seconds: mediaItem.duration
 *   - creator_username: post.username
 *   - like_count:    post.likeCount
 *   - course_name:   post.courseName ?? post.review.courseName
 */
function toFeedCardRow(post: FeedPost): FeedCardRow {
  const media = post.mediaItems[0] as (typeof post.mediaItems[number] & { format?: 'clip' | 'video'; width?: number | string | null; height?: number | string | null }) | undefined;
  const explicit = media?.format;
  const duration = media?.duration ?? null;
  const derived: 'clip' | 'video' =
    explicit ??
    (media?.type === 'video'
      ? (duration != null && duration <= 90 ? 'clip' : 'video')
      : 'clip');
  const width = Number(media?.width) || null;
  const height = Number(media?.height) || null;
  return {
    post_id: post.id,
    post_content: post.caption ?? null,
    derived_format: derived,
    poster_url: media?.thumbnailUrl ?? media?.imageUrl ?? null,
    duration_seconds: duration,
    creator_username: post.username ?? null,
    like_count: Number(post.likeCount ?? 0),
    course_name: post.courseName ?? post.review?.courseName ?? null,
    width,
    height,
  };
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
    root: SCROLL_ROOT ?? undefined,
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

  useEffect(() => {
    if (!isFetchingNextPage) fetchGuard.current = false;
  }, [isFetchingNextPage]);

  // Sync new posts into fullscreen overlay — only when THIS surface owns it.
  const isViewerOwnedHere = useIsViewerOwnedBy('explore');
  const appendPosts = useFullscreenFeedStore((s) => s.appendPosts);

  useEffect(() => {
    if (!isViewerOwnedHere) return;
    if (coursePosts.length > 0) {
      appendPosts(coursePosts);
    }
  }, [coursePosts.length, isViewerOwnedHere, appendPosts, coursePosts]);

  const { activeIndices, railRef: autoplayRef } = useWatchAutoplay({
    railId: 'explore-grid',
    posts: coursePosts,
    maxActive: 3,
  });
  const setGridRef = useCallback((el: HTMLDivElement | null) => {
    autoplayRef(el);
    if (gridRef) (gridRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [autoplayRef, gridRef]);

  const cardRows = useMemo(() => coursePosts.map(toFeedCardRow), [coursePosts]);

  if (isLoading) return <ExploreGridSkeleton />;

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

  const packed = packColumns(cardRows, (r) => {
    const w = Number(r?.width) || 0;
    const h = Number(r?.height) || 0;
    return w > 0 && h > 0 && w > h ? 16 / 9 : 9 / 14;
  });

  return (
    <div ref={setGridRef}>
      <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
        <div style={{ flex: 1 }}>
          {packed.left.map(({ item, flatIndex: i }) => (
            <FeedCard
              key={coursePosts[i].id}
              row={item}
              feedPost={coursePosts[i]}
              posts={coursePosts}
              flatIndex={i}
              isAutoplayActive={activeIndices.has(i)}
              openedFrom="explore"
              hideFormatBadge
            />
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {packed.right.map(({ item, flatIndex: i }) => (
            <FeedCard
              key={coursePosts[i].id}
              row={item}
              feedPost={coursePosts[i]}
              posts={coursePosts}
              flatIndex={i}
              isAutoplayActive={activeIndices.has(i)}
              openedFrom="explore"
              hideFormatBadge
            />
          ))}

        </div>
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
