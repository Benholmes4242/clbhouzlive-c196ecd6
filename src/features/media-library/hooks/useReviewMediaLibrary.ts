/**
 * BRIEF_WATCH_SEE_ALL S3 — /explore/reviews reads the whole review-media
 * library, paged 24 at a time by an explicit Load more (no infinite scroll).
 *
 * S3.4: the review's SCORE lives on the same row as its media's parent
 * (course_ratings.rating, course_review_media.review_id), so Highest rated and
 * Lowest rated are ordinary server-side orders — no extra join was needed.
 *
 * BY COURSE groups reviews of the same course together by ordering on
 * course_id: PostgREST cannot order a parent by an embedded course NAME, so the
 * grouping is by course, alphabetised client-side within the loaded pages.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

export const REVIEW_LIBRARY_SORTS = ['recent', 'highest', 'lowest', 'course'] as const;
export type ReviewLibrarySort = (typeof REVIEW_LIBRARY_SORTS)[number];

export const REVIEW_LIBRARY_SORT_LABELS: Record<ReviewLibrarySort, string> = {
  recent: 'Most recent',
  highest: 'Highest rated',
  lowest: 'Lowest rated',
  course: 'By course',
};

export const REVIEW_LIBRARY_PAGE_SIZE = 24;

export interface ReviewLibraryTile {
  reviewId: string;
  courseId: string;
  courseName: string;
  reviewerName: string;
  rating: number;
  at: string;
  thumbnail: string | null;
  mediaCount: number;
  post: FeedPost;
}

interface MediaRow {
  id: string;
  media_url: string | null;
  media_type: string | null;
  poster_url: string | null;
  stream_id: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  is_cover: boolean | null;
  created_at: string | null;
}

interface Row {
  id: string;
  course_id: string | null;
  user_id: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  course: { id: string; name: string | null } | null;
  user_profiles: { display_name: string | null; username: string | null; profile_photo_url: string | null } | null;
  course_review_media: MediaRow[] | null;
}

const SELECT = `
  id, course_id, user_id, rating, review, created_at,
  course:golf_courses!course_id ( id, name ),
  user_profiles:user_id ( display_name, username, profile_photo_url ),
  course_review_media!inner ( id, media_url, media_type, poster_url, stream_id, width, height, duration_seconds, is_cover, created_at )
`;

function toMediaItems(rows: MediaRow[]): MediaItem[] {
  return rows
    .filter((row) => !!row.media_url || !!row.poster_url)
    .map((row, index) => {
      const isVideo = String(row.media_type ?? '').toLowerCase().includes('video');
      return {
        id: row.id,
        type: isVideo ? 'video' : 'image',
        hlsUrl: isVideo && row.stream_id ? generateStreamHlsUrl(row.stream_id) : undefined,
        imageUrl: isVideo ? undefined : row.media_url ?? undefined,
        thumbnailUrl: row.poster_url ?? row.media_url ?? undefined,
        streamId: row.stream_id ?? undefined,
        width: row.width ?? 1080,
        height: row.height ?? 1350,
        duration: row.duration_seconds != null ? Number(row.duration_seconds) : undefined,
        displayOrder: index,
      } satisfies MediaItem;
    });
}

function mapRow(row: Row): ReviewLibraryTile | null {
  const media = [...(row.course_review_media ?? [])].sort((a, b) => {
    if (!!a.is_cover !== !!b.is_cover) return a.is_cover ? -1 : 1;
    return String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));
  });
  const items = toMediaItems(media);
  if (items.length === 0 || !row.course?.id) return null;
  const profile = row.user_profiles;
  const reviewerName = String(profile?.display_name ?? profile?.username ?? '').trim() || 'A member';
  const post: FeedPost = {
    id: row.id,
    userId: row.user_id ?? '',
    actorType: 'personal',
    actorId: row.user_id ?? '',
    username: profile?.username ?? '',
    displayName: reviewerName,
    avatarUrl: profile?.profile_photo_url ?? '',
    isVerified: false,
    creatorRelation: 'none',
    caption: String(row.review ?? '').trim(),
    mediaItems: items,
    createdAt: row.created_at,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    review: null,
    isReview: true,
    isLikedByMe: false,
    isFollowedByMe: false,
    courseId: row.course.id,
    courseName: (row.course.name ?? '').trim() || undefined,
  };
  return {
    reviewId: row.id,
    courseId: row.course.id,
    courseName: (row.course.name ?? '').trim(),
    reviewerName,
    rating: Number(row.rating ?? 0),
    at: row.created_at,
    thumbnail: items[0]?.thumbnailUrl ?? items[0]?.imageUrl ?? null,
    mediaCount: items.length,
    post,
  };
}

export function useReviewMediaLibrary(sort: ReviewLibrarySort) {
  return useInfiniteQuery({
    queryKey: ['review-media-library', sort],
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam ?? 0);
      const from = page * REVIEW_LIBRARY_PAGE_SIZE;
      let query = supabase
        .from('course_ratings')
        .select(SELECT, { count: 'exact' })
        .eq('is_mock', false)
        .not('review', 'is', null);

      if (sort === 'highest') query = query.order('rating', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      else if (sort === 'lowest') query = query.order('rating', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
      else if (sort === 'course') query = query.order('course_id', { ascending: true }).order('created_at', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query.range(from, from + REVIEW_LIBRARY_PAGE_SIZE - 1);
      if (error) throw error;
      const rows = ((data ?? []) as unknown as Row[])
        .map(mapRow)
        .filter((tile): tile is ReviewLibraryTile => !!tile);
      return { rows, page, total: count ?? null, rawLength: (data ?? []).length };
    },
    getNextPageParam: (last) => (last.rawLength < REVIEW_LIBRARY_PAGE_SIZE ? undefined : last.page + 1),
  });
}
