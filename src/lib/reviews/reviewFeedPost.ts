/**
 * reviewFeedPost — THE one review → FeedPost adapter (CANONICAL_FULLSCREEN_VIEWER
 * part 1). Every review-media open (Latest reviews rail, course Reviews tab,
 * the review card, the About Photos strip) builds its viewer posts here, so the
 * fullscreen viewer sees one shape and surfaces differ only in data.
 *
 * engagementTarget { type: 'review', id } routes the viewer's like, comment,
 * likers and share to the REVIEW (content_reactions / comments_v2 target
 * 'review'); the post like mutation is never called for these posts. The
 * zero post counters below are therefore never read for engagement.
 * Video posters come from holeMediaPoster; a playback URL is never a poster.
 */
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';

export interface ReviewFeedPostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  posterUrl?: string | null;
  streamId?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface ReviewFeedPostInput {
  reviewId: string;
  userId: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  text?: string | null;
  createdAt?: string | null;
  media: readonly ReviewFeedPostMedia[];
  courseId: string;
  courseName: string;
  courseImageUrl?: string | null;
  rating: number | null;
  courseCountry?: string | null;
  courseRegion?: string | null;
  courseSubCountry?: string | null;
  breakdown?: {
    design: number | null;
    conditions: number | null;
    clubhouse: number | null;
    facilities: number | null;
  } | null;
}

function toMediaItem(m: ReviewFeedPostMedia): MediaItem {
  const isVideo = m.type === 'video';
  const derived = isVideo
    ? holeMediaPoster({ media_type: 'video', media_url: m.url, poster_url: m.posterUrl ?? null, stream_id: m.streamId ?? null })
    : '';
  const poster = isVideo ? (derived && derived !== m.url ? derived : undefined) : (m.posterUrl || undefined);
  return {
    id: m.id,
    type: isVideo ? 'video' : 'image',
    hlsUrl: isVideo ? m.url : undefined,
    imageUrl: isVideo ? undefined : m.url,
    thumbnailUrl: poster,
    ...(m.streamId ? { streamId: m.streamId } : {}),
    width: m.width || 1080,
    height: m.height || 1080,
    ...(m.durationSeconds ? { duration: m.durationSeconds } : {}),
  };
}

export function reviewFeedPost(input: ReviewFeedPostInput): FeedPost {
  const text = input.text ?? '';
  return {
    id: input.reviewId,
    userId: input.userId ?? '',
    actorType: 'personal',
    actorId: input.userId ?? '',
    username: input.username || '',
    displayName: input.displayName || 'Golfer',
    avatarUrl: input.avatarUrl || '',
    isVerified: false,
    creatorRelation: 'none',
    caption: text,
    createdAt: input.createdAt || new Date().toISOString(),
    mediaItems: input.media.filter(m => !!m.url).map(toMediaItem),
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    isLikedByMe: false,
    isFollowedByMe: false,
    tags: [],
    isReview: true,
    courseId: input.courseId,
    courseName: input.courseName,
    review: {
      reviewId: input.reviewId,
      courseId: input.courseId,
      courseName: input.courseName,
      courseImageUrl: input.courseImageUrl ?? null,
      rating: input.rating ?? 0,
      courseCountry: input.courseCountry ?? null,
      courseRegion: input.courseRegion ?? null,
      courseSubCountry: input.courseSubCountry ?? null,
      reviewText: text || null,
      breakdown: input.breakdown ?? null,
    },
    engagementTarget: { type: 'review', id: input.reviewId },
  };
}

/** LatestReview (useBrowseReviews / useLatestReviews rows) → adapter input. */
export function latestReviewInput(r: LatestReview): ReviewFeedPostInput {
  return {
    reviewId: r.reviewId, userId: r.userId, username: r.reviewerUsername,
    displayName: r.reviewerName, avatarUrl: r.reviewerAvatar, text: r.quote, createdAt: r.at,
    media: r.media ?? [], courseId: r.courseId, courseName: r.courseName,
    courseImageUrl: r.courseImage, rating: r.rating, courseCountry: r.courseCountry,
    courseRegion: r.courseRegion, courseSubCountry: r.courseSubCountry, breakdown: r.breakdown,
  };
}
