import { useCallback, useEffect, useMemo, useState } from 'react';

import { MediaRailTile } from '@/components/explore-tab-new/courseled/MediaRailTile';
import { MomentsGrid } from '@/components/explore-tab-new/courseled/MomentsGrid';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useMomentsOfTheWeek } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useLatestReviews } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { useDiscoverMediaPreview } from '@/components/explore-tab-new/courseled/hooks/useDiscoverMediaPreview';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { useWatchHubCounts } from '@/features/watch-v2/hooks/useWatchHubCounts';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';
import { useGalleryCourseMedia } from '@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia';
import { FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { useMergedLibraryTotal } from '@/features/media-library/libraryTotals';
import type { FeedPost } from '@/components/media-system/types/media';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * BLOCK 4 - MEDIA (BRIEF_AMATEUR_PAGE).
 *
 * ONE MOSAIC, TWO SOURCES. Review photographs and course-tagged member moments
 * are one wall of member media in one geometry (MomentsGrid, the deployed
 * mosaic), because a member does not think of them as two collections.
 *
 * TAP BEHAVIOUR IS UNIFORM AND HAS NO EXCEPTIONS. Every tile - review or moment
 * - opens THAT COURSE'S media set (get_course_media_v2, filter `all`, the course
 * page's own order) at the tapped image, browsed VERTICALLY, through the course
 * media viewer surface. That viewer names the course in its header and links
 * through to the course page, which is why the set is the course's and not the
 * set on screen.
 *
 * THE PRICE OF THAT CHOICE IS PAID: leaving for a see-all records the scroll
 * offset and coming back restores it (amateurScrollMemory). The viewer itself is
 * an overlay and never unmounts the page.
 *
 * THREE SECTIONS, THREE SHAPES: the clips rail, the merged mosaic, then LONGER
 * WATCH - two rows of long-form video. The long-form rows are here and not
 * behind a see-all because long-form is the only format the creator accounts
 * publish in; burying it would be a decision about those creators rather than
 * about layout. Media SEARCH still lives on Watch.
 *
 * THE RAILS ARE NOT COURSE-LED, and cannot be: 236 of 242 media posts carry no
 * course tag. So the uniform course-set tap rule applies to the MOSAIC, whose
 * tiles all carry a course. A clip or a video opens its own post in the
 * fullscreen viewer, exactly as Watch opens it.
 *
 * TWO PLAYERS MAXIMUM. Tiles play through reviewVideoAutoplay's own group cap of
 * two, muted, looping, playsInline, poster-first, IntersectionObserver-elected,
 * and poster-only under reduced motion or Save-Data. This page adds no third.
 *
 * THE COUNT IS THE LIBRARY'S, never the loaded array: the two count queries in
 * libraryTotals, summed. It carries NO basis line - this block is not governed
 * by the page filter, and that absence is the boundary marker.
 */

const MOSAIC_CAP = 9;
const CLIPS_CAP = 8;
/** Two rows, as ruled. Not a rail, not a see-all. */
const VIDEO_ROWS = 2;
/** ONE GROUP FOR THE WHOLE BLOCK, so two players is the page's budget and not
    each section's. */
const AUTOPLAY_GROUP = 'amateur-media';

/**
 * LONGER WATCH row: 116x66 poster left at r.sm, title 13/600 over two lines,
 * creator beneath, the canonical glass duration badge, hairline between rows.
 */
function VideoRow({ item, first, onPress }: { item: CommunityLibraryItem; first: boolean; onPress: () => void }) {
  const title = item.title?.trim() || item.courseName || item.displayName;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        width: '100%',
        padding: first ? '11px 0' : '11px 0 0',
        marginTop: first ? 0 : 11,
        border: 0,
        borderTop: first ? 'none' : `1px solid ${A.BORDER}`,
        background: 'transparent',
        color: A.INK,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', width: 116, height: 66, flex: '0 0 116px', overflow: 'hidden', borderRadius: r.sm, background: A.PANEL }}>
        {item.thumbnail && (
          <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <GlassDurationBadge seconds={item.duration} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: '17px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.displayName}
        </div>
      </div>
    </button>
  );
}

/** The pending open: a course, and the media inside it that was tapped. */
interface Pending {
  courseId: string;
  mediaId: string | null;
  mediaUrl: string | null;
  posterUrl: string | null;
  source: 'review' | 'moment';
}

export function AmateurMediaBlock({
  userId,
  onSeeAll,
  onDepart,
}: {
  userId: string | undefined;
  onSeeAll: (path: string) => void;
  /** Called before the viewer opens, so the page can remember where it was. */
  onDepart: () => void;
}) {
  const [pending, setPending] = useState<Pending | null>(null);

  const momentsQuery = useMomentsOfTheWeek(30, { enabled: true, candidateLimit: 72 });
  const reviewsQuery = useLatestReviews(12, true);
  const courseMedia = useGalleryCourseMedia(pending?.courseId ?? null, userId);

  /* LIBRARY TOTALS, not rail lengths. */
  const mergedTotal = useMergedLibraryTotal();
  const hubCounts = useWatchHubCounts();

  /* CLIPS AND LONG-FORM come from the whole library, newest first, from the same
     read Watch uses - no second query and no new predicate. */
  const railMedia = useDiscoverMediaPreview(true);
  const clips = useMemo(() => (railMedia.data?.clips ?? []).slice(0, CLIPS_CAP), [railMedia.data]);
  const videos = useMemo(() => (railMedia.data?.videos ?? []).slice(0, VIDEO_ROWS), [railMedia.data]);

  const openPost = useCallback(
    (pool: CommunityLibraryItem[], item: CommunityLibraryItem, source: 'clip' | 'video') => {
      analyticsEvents.track('amateur_media_tile_tapped', { source, course_id: item.courseId, kind: item.kind });
      onDepart();
      const posts = pool.map((entry) => entry.post);
      const index = Math.max(0, posts.findIndex((post) => post.id === item.postId));
      openWithOrigin({
        posts,
        index,
        originEl: null,
        posterUrl: item.thumbnail,
        mediaIndex: item.mediaIndex ?? 0,
        mediaId: item.mediaId ?? null,
        openedFrom: source === 'clip' ? 'amateur-clips' : 'amateur-videos',
        forceStartAtZero: true,
      });
    },
    [onDepart],
  );

  const moments = useMemo(() => momentsQuery.data ?? [], [momentsQuery.data]);

  /* A REVIEW PHOTOGRAPH WEARS THE SAME TILE. Only the fields the tile reads are
     mapped; there is no synthetic feed post beyond what it touches, and a review
     carries no HLS manifest, so it rests on its poster. */
  const reviewTiles = useMemo<Moment[]>(
    () =>
      reviewsQuery.reviews
        .filter((review) => !!review.mediaUrl && !!review.courseId)
        .slice(0, 12)
        .map((review) => ({
          key: `review:${review.reviewId}`,
          courseId: review.courseId,
          courseName: review.courseName,
          post: {
            id: `review:${review.reviewId}`,
            createdAt: review.at,
            mediaItems: [],
          } as unknown as FeedPost,
          thumbnail: review.posterUrl ?? review.mediaUrl,
          mediaType: 'image' as const,
          mediaIndex: 0,
          mediaId: review.mediaId ?? undefined,
          isCourseLead: true,
          region: review.courseSubCountry,
          /* THE RATING TRAVELS WITH THE PHOTOGRAPH. It was always on the review
             row; it simply was not mapped, which is why no chip rendered. */
          rating: review.rating,
          aspect: null,
        })),
    [reviewsQuery.reviews],
  );

  /* INTERLEAVED, so the wall is neither all reviews nor all moments, and one
     course appears once. */
  const tiles = useMemo<Moment[]>(() => {
    const out: Moment[] = [];
    const seenCourses = new Set<string>();
    const longest = Math.max(moments.length, reviewTiles.length);
    for (let i = 0; i < longest && out.length < MOSAIC_CAP; i += 1) {
      for (const candidate of [moments[i], reviewTiles[i]]) {
        if (!candidate || out.length >= MOSAIC_CAP) continue;
        if (seenCourses.has(candidate.courseId)) continue;
        seenCourses.add(candidate.courseId);
        out.push(candidate);
      }
    }
    return out;
  }, [moments, reviewTiles]);

  /* THE COURSE'S SET, LANDING ON THE TAPPED IMAGE. Resolution waits for the
     course read; nothing else about the tap differs between the two sources. */
  useEffect(() => {
    if (!pending || !courseMedia.data) return;
    const posts = courseMedia.data;
    const matches = (item: { id?: string; imageUrl?: string | null; thumbnailUrl?: string | null; mp4Url?: string | null }) =>
      (!!pending.mediaId && item.id === pending.mediaId) ||
      (!!pending.mediaUrl &&
        (item.imageUrl === pending.mediaUrl ||
          item.thumbnailUrl === pending.mediaUrl ||
          item.mp4Url === pending.mediaUrl));

    let index = posts.findIndex((post) => post.mediaItems.some(matches));
    if (index < 0) index = 0;
    if (posts.length === 0) {
      setPending(null);
      return;
    }
    const media = posts[index].mediaItems.find(matches) ?? posts[index].mediaItems[0];
    onDepart();
    openWithOrigin({
      posts,
      index,
      originEl: null,
      posterUrl: pending.posterUrl,
      mediaId: media?.id ?? null,
      openedFrom: 'course-media',
      options: { readOnly: true },
    });
    setPending(null);
  }, [courseMedia.data, onDepart, pending]);

  const total = mergedTotal.data ?? 0;
  const pendingReads = momentsQuery.isPending || reviewsQuery.isPending;

  /* A held height while the two reads settle, so nothing below jumps. */
  if (pendingReads) return <div style={{ height: 320 }} aria-hidden />;
  /* EMPTY RENDERS NOTHING - and the mosaic is the block. No mosaic, no block. */
  if (tiles.length === 0) return null;

  return (
    /* THREE SECTIONS, THREE HEADINGS, THREE COUNTS. There is no covering
       "Media" heading: one heading over three subjects is what made the block
       read as one undifferentiated wall.
       ORDER: tall picture tiles, then TEXT-LED rows, then the grid. The rows sit
       between the two picture areas deliberately — clips beside the mosaic is
       picture-on-picture and reads heavy. */
    <section style={{ paddingTop: 26, fontFamily: SANS, ...FIGS }}>
      {clips.length > 0 && (
        <>
          <DiscoverSectionHeading
            title="Clips"
            right={(hubCounts.data?.clip_count ?? 0) > clips.length ? `See all ${hubCounts.data?.clip_count}` : null}
            onRightPress={() => {
              analyticsEvents.track('amateur_media_see_all_opened', { total: hubCounts.data?.clip_count ?? 0, section: 'clips' });
              onSeeAll('/watch/clips');
            }}
          />
          <div
            className="scrollbar-hide"
            style={{ display: 'flex', gap: 10, overflowX: 'auto', marginRight: -14, paddingRight: 14, willChange: 'transform' }}
          >
            {clips.map((item, index) => (
              <MediaRailTile
                key={item.key}
                item={item}
                index={index}
                width={176}
                autoplayGroup={AUTOPLAY_GROUP}
                onPress={() => openPost(clips, item, 'clip')}
              />
            ))}
          </div>
        </>
      )}

      {videos.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <DiscoverSectionHeading
            title="Longer watch"
            right={(hubCounts.data?.video_count ?? 0) > videos.length ? `See all ${hubCounts.data?.video_count}` : null}
            onRightPress={() => {
              analyticsEvents.track('amateur_media_see_all_opened', { total: hubCounts.data?.video_count ?? 0, section: 'videos' });
              onSeeAll('/watch/videos');
            }}
          />
          {videos.map((item, index) => (
            <VideoRow key={item.key} item={item} first={index === 0} onPress={() => openPost(videos, item, 'video')} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <DiscoverSectionHeading
          title="From the community"
          right={total > 0 ? `See all ${total}` : null}
          onRightPress={() => {
            analyticsEvents.track('amateur_media_see_all_opened', { total, section: 'mosaic' });
            /* /media carries the MERGED set this mosaic summarises. */
            onSeeAll('/media');
          }}
        />
        {/* THE TIGHT TREATMENT established for Moments: 2px gutter, r.xs corners.
            A wall, not a set of cards. */}
        <MomentsGrid
          moments={tiles}
          cap={MOSAIC_CAP}
          gap={2}
          tall={250}
          radius={6}
          autoplayGroup={AUTOPLAY_GROUP}
          onTilePress={(tile) => {
            const source = tile.key.startsWith('review:') ? 'review' : 'moment';
            analyticsEvents.track('amateur_media_tile_tapped', {
              source,
              course_id: tile.courseId,
              kind: tile.mediaType,
            });
            setPending({
              courseId: tile.courseId,
              mediaId: tile.mediaId ?? null,
              mediaUrl: tile.thumbnail,
              posterUrl: tile.thumbnail,
              source,
            });
          }}
        />
      </div>
    </section>
  );
}
