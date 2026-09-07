import { useEffect, useMemo, useState } from 'react';

import { MomentsGrid } from '@/components/explore-tab-new/courseled/MomentsGrid';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useMomentsOfTheWeek } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useLatestReviews } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { useGalleryCourseMedia } from '@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia';
import { FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { useMomentsLibraryTotal, useReviewLibraryTotal } from '@/features/media-library/libraryTotals';
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
 * NO SEPARATE CLIPS SECTION. A course-tagged vertical clip already IS a video
 * moment in this pool; a clips rail beside the mosaic would render the same post
 * twice, which the brief forbids. Long-form videos and media search stay on
 * Watch.
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
const AUTOPLAY_GROUP = 'amateur-media';

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
  const reviewTotal = useReviewLibraryTotal();
  const momentsTotal = useMomentsLibraryTotal();

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

  const total = (reviewTotal.data ?? 0) + (momentsTotal.data ?? 0);
  const pendingReads = momentsQuery.isPending || reviewsQuery.isPending;

  /* A held height while the two reads settle, so nothing below jumps. */
  if (pendingReads) return <div style={{ height: 320 }} aria-hidden />;
  if (tiles.length === 0) return null;

  return (
    <section style={{ paddingTop: 26, fontFamily: SANS, ...FIGS }}>
      <DiscoverSectionHeading
        title="Media"
        right={total > 0 ? `See all ${total}` : null}
        onRightPress={() => {
          analyticsEvents.track('amateur_media_see_all_opened', { total });
          /* THE EXISTING ROUTE until /explore/media exists at cutover. */
          onSeeAll('/explore/moments');
        }}
      />

      <MomentsGrid
        moments={tiles}
        cap={MOSAIC_CAP}
        gap={5}
        tall={250}
        radius={10}
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
    </section>
  );
}
