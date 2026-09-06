import { useQuery } from '@tanstack/react-query';

import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import { supabase } from '@/integrations/supabase/client';

interface ReviewMediaRow {
  id: string;
  media_type: string;
  media_url: string;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  is_cover: boolean | null;
  created_at: string;
}

interface ReviewRow {
  id: string;
  course_id: string;
  user_id: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  user_profiles: {
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
  course_review_media: ReviewMediaRow[] | null;
}

function streamPoster(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=1080`;
}

function orderedMedia(rows: ReviewMediaRow[]): ReviewMediaRow[] {
  return [...rows]
    .filter((row) => !!row.media_url)
    .sort((a, b) => Number(!!b.is_cover) - Number(!!a.is_cover) || a.created_at.localeCompare(b.created_at));
}

function toMediaItem(row: ReviewMediaRow): MediaItem {
  const isVideo = row.media_type.toLowerCase().includes('video');
  const poster = row.poster_url ?? (row.stream_id ? streamPoster(row.stream_id) : undefined);
  return {
    id: row.id,
    type: isVideo ? 'video' : 'image',
    hlsUrl: isVideo && row.stream_id && row.duration_seconds != null
      ? generateStreamHlsUrl(row.stream_id)
      : undefined,
    mp4Url: isVideo && !row.stream_id ? row.media_url : undefined,
    imageUrl: isVideo ? undefined : row.media_url,
    thumbnailUrl: poster ?? (isVideo ? undefined : row.media_url),
    streamId: row.stream_id ?? undefined,
    width: row.width ?? 1080,
    height: row.height ?? 1350,
    duration: row.duration_seconds ?? undefined,
    displayOrder: 0,
    isProcessing: isVideo && !!row.stream_id && row.duration_seconds == null,
  };
}

function toFeedPost(row: ReviewRow): FeedPost | null {
  const course = row.course;
  const mediaItems = orderedMedia(row.course_review_media ?? []).map(toMediaItem);
  if (!course?.id || mediaItems.length === 0) return null;
  const profile = row.user_profiles;
  const displayName = (profile?.display_name ?? profile?.username ?? 'A member').trim();
  const rating = Number(row.rating ?? 0);

  return {
    id: `gallery-review-${row.id}`,
    userId: row.user_id ?? '',
    actorType: 'personal',
    actorId: row.user_id ?? '',
    username: profile?.username ?? '',
    displayName,
    avatarUrl: profile?.profile_photo_url ?? '',
    isVerified: false,
    creatorRelation: 'none',
    caption: row.review ?? '',
    mediaItems,
    createdAt: row.created_at,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    review: {
      reviewId: row.id,
      courseId: course.id,
      courseName: course.name?.trim() || 'Golf course',
      courseImageUrl: course.thumbnail_image,
      rating,
      courseRegion: course.region,
      courseCountry: course.country,
      courseSubCountry: course.sub_country,
      reviewText: row.review,
      breakdown: {
        design: row.design_score,
        conditions: row.condition_score,
        clubhouse: row.clubhouse_score,
        facilities: row.facilities_score,
      },
    },
    isReview: true,
    isLikedByMe: false,
    isFollowedByMe: false,
    courseId: course.id,
    courseName: course.name ?? undefined,
    courseCountry: course.country ?? undefined,
    courseRegion: course.region ?? undefined,
    courseSubCountry: course.sub_country ?? undefined,
    viewerRating: rating,
  };
}

export function useGalleryCourseReviewMedia(courseId: string | null) {
  return useQuery({
    queryKey: ['discover', 'gallery', 'course-review-media', courseId],
    enabled: !!courseId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id, course_id, user_id, rating, review, created_at,
          design_score, condition_score, clubhouse_score, facilities_score,
          user_profiles:user_id ( username, display_name, profile_photo_url ),
          course:golf_courses!course_id ( id, name, country, region, sub_country, thumbnail_image ),
          course_review_media ( id, media_type, media_url, poster_url, stream_id, duration_seconds, width, height, is_cover, created_at )
        `)
        .eq('course_id', courseId)
        .eq('is_mock', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as ReviewRow[])
        .map(toFeedPost)
        .filter((post): post is FeedPost => post != null);
    },
  });
}