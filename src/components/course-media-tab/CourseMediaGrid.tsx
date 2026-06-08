import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseMediaViewerStore } from '@/components/course-media-tab/CourseMediaViewer';
import { AlertCircle, Camera, Loader2, Film, ListChecks, Flag, Sunrise, Building2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { CourseMediaTile } from './CourseMediaTile';
import { CourseMediaLandscapeCard } from './CourseMediaLandscapeCard';
import { CourseMediaGridSkeleton } from './CourseMediaGridSkeleton';
import { SectionLabel } from '@/components/courses/course-detail/SectionLabel';
import { PrimaryAmberCTA } from '@/components/ui/PrimaryAmberCTA';
import { EmptyStateGuide } from '@/components/ui/EmptyStateGuide';
import { AMBER, HAIRLINE_INK_7, HAIRLINE_INK_10, INK, INK_FAINT, INK_TINT_02, INK_TINT_06, SURFACE } from '@/features/courses/_shared/tokens';

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

  // Mirror the hook's pagination state into the dedicated viewer store so
  // SnapFeed sees fresh hasNextPage / isFetchingNextPage values reactively
  // (not just the snapshot taken at .open() time).
  const isViewerOpen = useCourseMediaViewerStore(s => s.isOpen);
  const setPaginationState = useCourseMediaViewerStore(s => s.setPaginationState);

  useEffect(() => {
    if (!isViewerOpen) return;
    setPaginationState({
      hasNextPage: hasNextPage ?? false,
      isFetchingNextPage: isFetchingNextPage ?? false,
    });
  }, [isViewerOpen, hasNextPage, isFetchingNextPage, setPaginationState]);

  // Single open-fullscreen entrypoint — wraps the store call with the current
  // pagination callbacks so the overlay can drive `fetchNextPage` itself.
  const handleOpenFullscreen = useCallback((postsToOpen: FeedPost[], index: number) => {
    useCourseMediaViewerStore.getState().open(postsToOpen, index, {
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

  let tileIndex = 0;
  const [firstPost, ...restPosts] = posts;
  const firstMediaKey = firstPost?.mediaItems[0]?.id || firstPost?.id;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Hero tile — first post always renders as 16:9 landscape card.
          Portrait sources are cropped via objectFit: cover for a consistent hero shape across courses.
          This sidesteps legacy media rows with NULL width/height that would otherwise mis-route to a broken portrait wrapper. */}
      {firstPost && (
        <div style={{ position: 'relative' }}>
          <CourseMediaLandscapeCard
            key={firstMediaKey}
            post={firstPost}
            index={tileIndex++}
            allPosts={posts}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onOpenFullscreen={handleOpenFullscreen}
          />
          {/* Featured badge — Dispatch glass pill (matches Explore + Hottest) */}
          <FeaturedPill style={{ position: 'absolute', top: 16, left: 16 }} />
        </div>
      )}

      {/* Square mosaic — uniform 3-col, periodic 2×2 feature */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, gridAutoFlow: 'dense' }}>
        {restPosts.map((post, i) => {
          const mediaKey = post.mediaItems[0]?.id || post.id;
          const idx = tileIndex++;
          // Every 7th tile (starting after the first row) becomes a 2×2 feature for rhythm.
          const isFeature = i > 2 && i % 7 === 0;
          return (
            <div
              key={mediaKey}
              style={isFeature ? { gridColumn: 'span 2', gridRow: 'span 2' } : undefined}
            >
              <CourseMediaTile
                post={post}
                index={idx}
                feature={isFeature}
                allPosts={posts}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onOpenFullscreen={handleOpenFullscreen}
              />
            </div>
          );
        })}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ gridColumn: '1 / -1', height: 1 }} />

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
            <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" />
          </div>
        )}
      </div>

    </div>
  );
});

CourseMediaGrid.displayName = 'CourseMediaGrid';
