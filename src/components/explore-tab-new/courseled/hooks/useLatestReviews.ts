import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { supabase } from '@/integrations/supabase/client';

/**
 * useLatestReviews (BRIEF_LATEST_REVIEWS, section 2).
 *
 * The ONLY opinion-carrying section on Discover, so the data contract is
 * deliberately narrow:
 *
 *   SOURCE        course_ratings, with course_review_media, user_profiles and
 *                 golf_courses embedded — ONE query per page, never a per-tile
 *                 read for media.
 *   QUALIFY       (a) prose: `review` non-empty after trim (score-only ratings
 *                 would render an empty quote, which is a broken tile);
 *                 (b) moderation: `is_mock = false` — the only moderation flag
 *                 course_ratings carries (there is no soft-delete column;
 *                 removals are hard deletes);
 *                 (c) the course row resolves.
 *   WINDOW        none. "Latest" means latest; the age chip tells the truth.
 *   ORDER         created_at DESC. No engagement weighting.
 *
 * Pagination: PAGE_SIZE rows per page. The page mosaic reads the first six of
 * page one; the see-all sheet walks the pages.
 */

export const LATEST_REVIEWS_PAGE_SIZE = 24;

export interface LatestReview {
  reviewId: string;
  courseId: string;
  courseName: string;
  courseImage: string | null;
  rating: number;
  quote: string;
  at: string;
  userId: string | null;
  reviewerName: string;
  reviewerUsername: string | null;
  reviewerAvatar: string | null;
  /** First media of the review, when it holds any. */
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  posterUrl: string | null;
  courseCountry: string | null;
  courseRegion: string | null;
  courseSubCountry: string | null;
  breakdown: {
    design: number | null;
    conditions: number | null;
    clubhouse: number | null;
    facilities: number | null;
  };
}

interface Row {
  id: string;
  course_id: string | null;
  user_id: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  user_profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
  course: {
    id: string;
    name: string | null;
    country: string | null;
    region: string | null;
    sub_country: string | null;
    thumbnail_image: string | null;
  } | null;
  course_review_media: Array<{
    id: string;
    media_type: string | null;
    media_url: string | null;
    poster_url: string | null;
    is_cover: boolean | null;
    created_at: string | null;
  }> | null;
}

const SELECT = `
  id,
  course_id,
  user_id,
  rating,
  review,
  created_at,
  design_score,
  condition_score,
  clubhouse_score,
  facilities_score,
  user_profiles:user_id ( id, username, display_name, profile_photo_url ),
  course:golf_courses!course_id ( id, name, country, region, sub_country, thumbnail_image ),
  course_review_media ( id, media_type, media_url, poster_url, is_cover, created_at )
`;

function firstMedia(row: Row) {
  const media = (row.course_review_media ?? []).filter((m) => !!m.media_url);
  if (media.length === 0) return null;
  const cover = media.find((m) => m.is_cover);
  const ordered = cover
    ? cover
    : [...media].sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')))[0];
  return ordered ?? null;
}

function mapRow(row: Row): LatestReview | null {
  const quote = String(row.review ?? '').trim();
  if (!quote) return null;
  if (!row.course?.id) return null;

  const media = firstMedia(row);
  const type = media
    ? String(media.media_type ?? '').toLowerCase().includes('video')
      ? 'video'
      : 'image'
    : null;
  const profile = row.user_profiles;

  return {
    reviewId: row.id,
    courseId: row.course.id,
    courseName: (row.course.name ?? '').trim(),
    courseImage: row.course.thumbnail_image ?? null,
    rating: Number(row.rating ?? 0),
    quote,
    at: row.created_at,
    userId: row.user_id ?? null,
    reviewerName: (profile?.display_name ?? profile?.username ?? '').trim(),
    reviewerUsername: profile?.username ?? null,
    reviewerAvatar: profile?.profile_photo_url ?? null,
    mediaUrl: media?.media_url ?? null,
    mediaType: type as 'image' | 'video' | null,
    posterUrl: media?.poster_url ?? null,
    courseCountry: row.course.country ?? null,
    courseRegion: row.course.region ?? null,
    courseSubCountry: row.course.sub_country ?? null,
    breakdown: {
      design: row.design_score ?? null,
      conditions: row.condition_score ?? null,
      clubhouse: row.clubhouse_score ?? null,
      facilities: row.facilities_score ?? null,
    },
  };
}

export function useLatestReviews(pageSize = LATEST_REVIEWS_PAGE_SIZE) {
  const query = useInfiniteQuery({
    queryKey: ['courseled', 'latest-reviews', pageSize],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam ?? 0);
      const from = page * pageSize;
      const { data, error, count } = await supabase
        .from('course_ratings')
        .select(SELECT, { count: 'exact' })
        .eq('is_mock', false)
        .not('review', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;

      const rows = ((data ?? []) as unknown as Row[])
        .map(mapRow)
        .filter((r): r is LatestReview => !!r);

      return { rows, page, total: count ?? null, rawLength: (data ?? []).length };
    },
    getNextPageParam: (last) => (last.rawLength < pageSize ? undefined : last.page + 1),
    staleTime: 60_000,
  });

  const reviews = useMemo(
    () => (query.data?.pages ?? []).flatMap((p) => p.rows),
    [query.data],
  );

  return {
    reviews,
    /** Total qualifying-ish count from the same read (no extra round trip). */
    total: query.data?.pages?.[0]?.total ?? null,
    isLoading: query.isLoading,
    /** Has NOT settled yet (BRIEF_DISCOVER_LOADING_STATES). Never disabled. */
    isPending: query.isPending,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}


export default useLatestReviews;
