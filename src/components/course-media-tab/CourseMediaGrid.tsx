import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { flattenPostsToMedia, flatIndexFor } from '@/components/fullscreen-feed/flattenPostsToMedia';
import { AlertCircle, Camera, Loader2, Film, ListChecks, Flag, Sunrise, Building2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { CourseMediaTile } from './CourseMediaTile';
import { CourseMediaGridSkeleton } from './CourseMediaGridSkeleton';
import { SectionLabel } from '@/components/courses/course-detail/SectionLabel';
import { PrimaryAmberCTA } from '@/components/ui/PrimaryAmberCTA';
import { EmptyStateGuide } from '@/components/ui/EmptyStateGuide';
import { AMBER, HAIRLINE_INK_7, HAIRLINE_INK_10, INK, INK_FAINT, INK_TINT_02, INK_TINT_06, SURFACE } from '@/features/courses/_shared/tokens';

const GAP = 1;
const COLS = 2;
const RADIUS = 0;
const FALLBACK_RATIO = 1;

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
  ratio: number;
}

interface CourseMediaGridProps {
  posts: FeedPost[];
  /** Grouped-by-post array for fullscreen handoff. Falls back to `posts` if not provided. */
  postsForFullscreen?: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  courseName?: string;
  courseId?: string;
}


export const CourseMediaGrid = forwardRef<HTMLDivElement, CourseMediaGridProps>(({
  posts,
  postsForFullscreen,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  courseName,
  courseId,
}, ref) => {
  const navigate = useNavigate();
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

  // Mirror the hook's pagination state into the fullscreen store so
  // SnapFeed sees fresh hasNextPage / isFetchingNextPage values reactively
  // (not just the snapshot taken at .open() time).
  const isViewerOpen = useFullscreenFeedStore(s => s.isOpen);
  const setPaginationState = useFullscreenFeedStore(s => s.setPaginationState);

  useEffect(() => {
    if (!isViewerOpen) return;
    setPaginationState({
      hasNextPage: hasNextPage ?? false,
      isFetchingNextPage: isFetchingNextPage ?? false,
    });
  }, [isViewerOpen, hasNextPage, isFetchingNextPage, setPaginationState]);

  // Append flattened pages into the open viewer (store dedupes by flat id),
  // so infinite scroll keeps loading more without index drift.
  useEffect(() => {
    if (!isViewerOpen) return;
    const { flat } = flattenPostsToMedia(posts);
    useFullscreenFeedStore.getState().appendPosts(flat);
  }, [isViewerOpen, posts]);

  // Single open-fullscreen entrypoint — flattens to one-media-per-slide
  // and opens the fullscreen viewer in read-only (gallery) mode with the
  // current pagination callbacks.
  const handleOpenFullscreen = useCallback((postsToOpen: FeedPost[], index: number) => {
    const { flat, offsetsByParent } = flattenPostsToMedia(postsToOpen);
    useFullscreenFeedStore.getState().open(flat, flatIndexFor(offsetsByParent, index, 0), {
      readOnly: true,
      hasNextPage: hasNextPage ?? false,
      fetchNextPage: hasNextPage ? () => fetchNextPage() : undefined,
      isFetchingNextPage: isFetchingNextPage ?? false,
    });
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);



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
      <div style={{ paddingBottom: 40 }}>
        {/* Hero empty */}
        <div style={{ padding: '44px 24px 28px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(247,147,30,0.07)', border: '1.5px solid rgba(247,147,30,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Camera size={30} strokeWidth={1.8} color={AMBER} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, color: INK, letterSpacing: '-0.03em', marginBottom: 6 }}>No media yet</div>
          <p style={{ fontSize: 13, color: INK_FAINT, lineHeight: 1.6, maxWidth: 270, margin: '0 auto 24px' }}>
            Be the first to capture {courseName || 'this course'} — photos and videos from your round help fellow golfers discover it.
          </p>
          <PrimaryAmberCTA
            onClick={() => courseId && navigate(`/courses/${courseId}/rate`)}
            leadingIcon={<Camera size={15} strokeWidth={2} />}
            style={{ marginBottom: 10 }}
          >
            Share your experience
          </PrimaryAmberCTA>
          <button
            type="button"
            onClick={() => navigate('/share')}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: 'transparent', color: INK, fontSize: 13, fontWeight: 700, border: `1.5px solid ${HAIRLINE_INK_10}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <Film size={15} strokeWidth={2} />
            Upload a video
          </button>
        </div>

        <div style={{ height: '0.5px', background: HAIRLINE_INK_7, margin: '0 16px 24px' }} />

        {/* What to share guide */}
        <EmptyStateGuide
          kicker="What to share"
          items={[
            { icon: Flag,      label: 'Signature holes',        sub: 'Show the world what makes this course special' },
            { icon: Film,      label: 'Shots from your round',  sub: 'Short clips of your best moments on the course' },
            { icon: Sunrise,   label: 'Views & atmosphere',     sub: 'Sunsets, landscapes, the feeling of being there' },
            { icon: Building2, label: 'Clubhouse & facilities', sub: 'Help others know what to expect before they visit' },
          ]}
        />
      </div>
    );
  }

  // Shortest-column masonry distribution (mirrors WatchGrid)
  const columns: PlacedTile[][] = (() => {
    const cols: PlacedTile[][] = Array.from({ length: COLS }, () => []);
    const heights = new Array(COLS).fill(0);
    posts.forEach((post, i) => {
      const w = post.mediaItems?.[0]?.width;
      const h = post.mediaItems?.[0]?.height;
      const ratio = w && h && w > 0 && h > 0 ? w / h : FALLBACK_RATIO;
      const tileH = 1 / ratio;
      let target = 0;
      for (let c = 1; c < COLS; c++) {
        if (heights[c] < heights[target]) target = c;
      }
      cols[target].push({ post, index: i, ratio });
      heights[target] += tileH;
    });
    return cols;
  })();

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
      <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start', paddingInline: 0 }}>
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
            {col.map(({ post, index, ratio }) => {
              const mediaKey = post.mediaItems[0]?.id || post.id;
              return (
                <div
                  key={mediaKey}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: `${ratio}`,
                    ...cornerRadius(ci),
                    overflow: 'hidden',
                  }}
                >
                  <CourseMediaTile
                    post={post}
                    index={index}
                    allPosts={posts}
                    fetchNextPage={fetchNextPage}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onOpenFullscreen={handleOpenFullscreen}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} style={{ height: 1, width: '100%' }} />

      {isFetchingNextPage && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
          <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" />
        </div>
      )}
    </div>
  );
});

CourseMediaGrid.displayName = 'CourseMediaGrid';
