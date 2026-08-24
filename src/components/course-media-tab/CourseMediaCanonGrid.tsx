/**
 * CourseMediaCanonGrid — canonical FeedCard + packColumns grid, mounted
 * inside the course detail Media tab. Data still comes from
 * useCourseMedia (get_course_media RPC + posts/postsForFullscreen
 * dual-shape). The old CourseMediaGrid/Tile/LandscapeCard/Skeleton
 * family is retired.
 *
 * Card attribution: hideCourseAttribution — the page IS the course.
 * Orientation frames: FeedCard's canonical rule (w > h → 16/9, else
 * 9/14) via packColumns.
 *
 * Tap wiring (canonical) — FeedCard emits
 * openWithOrigin({ openedFrom: 'course-media', options: { readOnly: true } })
 * via the opt-in readOnlyFullscreen prop set on both mosaic columns
 * below. Read-only matches every other course-detail surface (About
 * strip, Reviews tab): no like / comment / share / follow chrome, mute
 * still available on videos. Photos and videos share the SAME
 * fullscreen viewer (no split lightbox path), and the pagination
 * callbacks are mirrored into the fullscreen store below.
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import { EmptyState } from '@/features/courses/components/holes/analytical/tokens';
import { FeedCard, type FeedCardRow } from '@/components/feed-cards/FeedCard';
import { packColumns } from '@/components/feed-cards/packColumns';
import { useFullscreenFeedStore, useIsViewerOwnedBy } from '@/store/fullscreenFeedStore';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { AMBER } from '@/features/courses/_shared/tokens';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface CourseMediaCanonGridProps {
  posts: FeedPost[];
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

// Same FeedPost → FeedCardRow projection ExploreGrid uses (Brief U3R).
function toFeedCardRow(post: FeedPost): FeedCardRow {
  const media = post.mediaItems[0] as (typeof post.mediaItems[0] & {
    format?: 'clip' | 'video';
    width?: number | null;
    height?: number | null;
  }) | undefined;
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
    creator_display_name: post.displayName ?? null,

    like_count: Number(post.likeCount ?? 0),
    course_name: post.courseName ?? post.review?.courseName ?? null,
    width,
    height,
  };
}

function SkeletonTile() {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          width: '100%',
          aspectRatio: '9 / 14',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
  );
}

export const CourseMediaCanonGrid = forwardRef<HTMLDivElement, CourseMediaCanonGridProps>(({
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
  const { t } = useTranslation(['courses', 'common']);
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { activeIndices, railRef: autoplayRef } = useWatchAutoplay({
    railId: 'course-media',
    posts,
    maxActive: 3,
  });
  const setGridRef = useCallback((el: HTMLDivElement | null) => {
    autoplayRef(el);
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [autoplayRef, ref]);

  // Infinite scroll — same IntersectionObserver rootMargin the other canon
  // consumers use.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Mirror pagination + append grouped posts into the fullscreen store when
  // this surface owns it (preserves infinite scroll inside the viewer).
  const isViewerOwnedHere = useIsViewerOwnedBy('course-media');
  const setPaginationState = useFullscreenFeedStore((s) => s.setPaginationState);

  useEffect(() => {
    if (!isViewerOwnedHere) return;
    setPaginationState({
      hasNextPage: hasNextPage ?? false,
      isFetchingNextPage: isFetchingNextPage ?? false,
    });
  }, [isViewerOwnedHere, hasNextPage, isFetchingNextPage, setPaginationState]);

  const groupedForViewer = useMemo(
    () => postsForFullscreen ?? groupMultiMedia(posts),
    [postsForFullscreen, posts],
  );

  useEffect(() => {
    if (!isViewerOwnedHere) return;
    useFullscreenFeedStore.getState().appendPosts(groupedForViewer);
  }, [isViewerOwnedHere, groupedForViewer]);

  const cardRows = useMemo(() => posts.map(toFeedCardRow), [posts]);

  if (isLoading) {
    return (
      <div style={{ padding: '12px 4px 0', fontFamily: FONT_FAMILY }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ flex: 1 }}>
            <SkeletonTile />
            <SkeletonTile />
          </div>
          <div style={{ flex: 1 }}>
            <SkeletonTile />
            <SkeletonTile />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="text-base font-semibold text-foreground">{t('courses:media.errorTitle')}</p>
        <p className="text-sm text-muted-foreground">{t('courses:media.errorBody')}</p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-full text-sm font-semibold active:scale-[0.97] transition-all min-h-[44px]"
          style={{ background: A.INK, color: A.CANVAS }}
        >
          {t('common:action.retry')}
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ padding: '20px 16px' }}>
        <EmptyState
          title={t('courses:media.emptyTitle')}
          body={t('courses:media.emptyBody', {
            courseName: courseName || t('courses:media.emptyCourseFallback'),
          }).replace(/<\/?1>/g, '')}
          primary={{
            label: t('courses:media.shareExperience'),
            onClick: () => courseId && navigate(`/courses/${courseId}/rate`),
          }}
          guidanceHeading={t('courses:media.guide.kicker')}
          guidance={[
            { title: t('courses:media.guide.signatureHoles'), body: t('courses:media.guide.signatureHolesSub') },
            { title: t('courses:media.guide.shots'), body: t('courses:media.guide.shotsSub') },
            { title: t('courses:media.guide.views'), body: t('courses:media.guide.viewsSub') },
            { title: t('courses:media.guide.clubhouse'), body: t('courses:media.guide.clubhouseSub') },
          ]}
        />
      </div>
    );
  }

  const packed = packColumns(cardRows, (r) => {
    const w = Number(r?.width) || 0;
    const h = Number(r?.height) || 0;
    return w > 0 && h > 0 && w > h ? 16 / 9 : 9 / 14;
  });

  return (
    <div ref={setGridRef} style={{ fontFamily: FONT_FAMILY, padding: '12px 0 0' }}>
      <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
        <div style={{ flex: 1 }}>
          {packed.left.map(({ item, flatIndex: i }) => {
            // KEY MUST BE PER-TILE, NOT PER-POST. Course media is one row per
            // media item, so a single post can contribute multiple tiles that
            // all share post_id. Keying by post_id causes React to reconcile
            // sibling tiles by position under a duplicate key — swapping a
            // video's poster/duration onto an image tile after a filter change
            // ("photo tile with a 0:10 badge" symptom).
            const tileKey = posts[i]?.mediaItems[0]?.id ?? `${item.post_id}-${i}`;
            return (
              <FeedCard
                key={tileKey}
                row={item}
                feedPost={posts[i]}
                posts={posts}
                flatIndex={i}
                isAutoplayActive={activeIndices.has(i)}
                openedFrom="course-media"
                hideCourseAttribution
                hideFormatBadge
              bareTile
                readOnlyFullscreen
                hideLikeCount
              />

            );
          })}
        </div>
        <div style={{ flex: 1 }}>
          {packed.right.map(({ item, flatIndex: i }) => {
            const tileKey = posts[i]?.mediaItems[0]?.id ?? `${item.post_id}-${i}`;
            return (
              <FeedCard
                key={tileKey}
                row={item}
                feedPost={posts[i]}
                posts={posts}
                flatIndex={i}
                isAutoplayActive={activeIndices.has(i)}
                openedFrom="course-media"
                hideCourseAttribution
                hideFormatBadge
              bareTile
                readOnlyFullscreen
                hideLikeCount
              />

            );
          })}
        </div>
      </div>

      <div ref={sentinelRef} style={{ height: 1, width: '100%' }} />

      {isFetchingNextPage && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} />
        </div>
      )}
    </div>
  );
});

CourseMediaCanonGrid.displayName = 'CourseMediaCanonGrid';

export default CourseMediaCanonGrid;
