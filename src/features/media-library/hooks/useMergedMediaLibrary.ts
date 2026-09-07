/**
 * THE MERGED MEDIA LIBRARY behind /media.
 *
 * The Amateur mosaic is ONE WALL OF TWO SOURCES — review photographs and
 * course-tagged member moments — so its see-all must hold the same union. A
 * destination that carried only the moments pool returned FEWER things than the
 * summary that sent the member there, and no printed figure could be right.
 *
 * Both sources are read whole (the moments pool all-time and uncapped per post;
 * the review library in one shot) and merged into the mosaic's own `Moment`
 * shape, so the existing geometry renders them without knowing which is which.
 * Paging is client-side in the page, over the merged list.
 *
 * COUNTING PARITY: one tile per review (extra frames ride the tile's +N badge)
 * and one tile per moment media item — exactly what countMergedLibrary sums.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useMomentsOfTheWeek } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import type { FeedPost } from '@/components/media-system/types/media';
import { fetchReviewLibraryTiles, type ReviewLibraryTile } from './useReviewMediaLibrary';

export const MERGED_SORTS = ['recent', 'course'] as const;
export type MergedSort = (typeof MERGED_SORTS)[number];

export const MERGED_SORT_LABELS: Record<MergedSort, string> = {
  recent: 'Most recent',
  course: 'By course',
};

export interface MergedTile {
  moment: Moment;
  /** Present for review tiles; the page opens the review itself, read-only. */
  review: ReviewLibraryTile | null;
}

/** A review wears the mosaic tile. Only fields the tile reads are mapped. */
function reviewToMoment(tile: ReviewLibraryTile): Moment {
  return {
    key: `review:${tile.reviewId}`,
    courseId: tile.courseId,
    courseName: tile.courseName || null,
    post: tile.post as FeedPost,
    thumbnail: tile.thumbnail,
    mediaType: 'image',
    mediaIndex: 0,
    mediaId: tile.post.mediaItems[0]?.id ?? undefined,
    isCourseLead: true,
    region: null,
    aspect: null,
  };
}

export function useMergedMediaLibrary(sort: MergedSort) {
  /* ALL-TIME, uncapped per post — the same read /media used before the merge. */
  const moments = useMomentsOfTheWeek(null, { sort: 'recent', maxPerPost: Number.POSITIVE_INFINITY });
  const reviews = useQuery({
    queryKey: ['review-media-library', 'all', 'recent'],
    staleTime: 60_000,
    queryFn: () => fetchReviewLibraryTiles(),
  });

  const tiles = useMemo<MergedTile[]>(() => {
    const merged: MergedTile[] = [
      ...(moments.data ?? []).map((moment) => ({ moment, review: null })),
      ...(reviews.data ?? []).map((review) => ({ moment: reviewToMoment(review), review })),
    ];
    const at = (t: MergedTile) => String(t.review?.at ?? t.moment.post.createdAt ?? '');
    if (sort === 'course') {
      return merged.sort(
        (a, b) =>
          String(a.moment.courseName ?? '').localeCompare(String(b.moment.courseName ?? '')) ||
          at(b).localeCompare(at(a)),
      );
    }
    return merged.sort((a, b) => at(b).localeCompare(at(a)));
  }, [moments.data, reviews.data, sort]);

  return {
    tiles,
    /* BOTH READS GATE THE PAGE: a half-merged wall is the fault we are fixing. */
    isPending: moments.isPending || reviews.isPending,
    isError: moments.isError || reviews.isError,
  };
}
