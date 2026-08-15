/**
 * Map ActivityPost (from useActivityPosts) → FeedPost (for FullscreenFeedOverlay).
 *
 * ActivityPost is the denormalised shape from the user's profile Activity query.
 * FeedPost is the normalised shape used by SnapFeed and FeedOverlayLayer.
 * Review data is extracted from the post content/metadata and surfaced on the
 * FeedPost.review field.
 */

import type { ActivityPost } from '@/components/profile/types/ActivityTypes';
import type { FeedPost, ReviewData, MediaItem } from '@/components/media-system/types/media';
import { isReviewPost, extractReviewData, extractUserData } from '@/lib/postHelpers';
import {
  extractStreamUid,
  generateStreamHlsUrl,
  generateStreamThumbnailUrl,
} from '@/config/cloudflareStream';

/**
 * COUNTS AND THE LIKED FLAG (BRIEF_ACTIVITY_NEW_TAB_AND_LIKE_COUNTS §3).
 *
 * ActivityPost carries `likes`/`comments` but nothing about the VIEWER, so this
 * mapper used to hardcode `isLikedByMe: false`. Callers that do know the viewer
 * state (the notification/deep-link path, which resolves it with
 * viewer_liked_post — the only correct route, since round-backed posts record
 * the like in content_reactions and not in post_likes) pass it in here.
 */
export type ActivityPostViewerState = {
  isLikedByMe?: boolean;
  isFollowedByMe?: boolean;
};

export function mapActivityPostToFeedPost(
  post: ActivityPost,
  viewer: ActivityPostViewerState = {},
): FeedPost {

  const userData = extractUserData(post);
  const isReview = isReviewPost(post);
  const reviewData = isReview ? extractReviewData(post) : null;

  // VIDEO SOURCES RESOLVE EXACTLY AS THE FEED DOES (feedMapper.mapRowToFeedPost):
  //   1. stream_id column
  //   2. a stream UID extracted from media_url
  //   3. media_url used directly (plain mp4, or a real .m3u8)
  // Stream rows carry a NULL media_url, so building from stream_id is the only
  // way the fullscreen viewer ever gets a playable manifest.
  const mediaItems: MediaItem[] = (post.post_media || []).map((m, idx) => {
    const isVideo = m.media_type === 'video';
    const src = m.media_url || '';
    const streamId = m.stream_id || (isVideo ? extractStreamUid(src) : null);
    const isHls = isVideo && src.includes('.m3u8');
    // Readiness proxy, same as feedMapper: duration_seconds is stamped by the
    // Cloudflare webhook. An unencoded video gets no manifest (poster only).
    const videoReady = isVideo && m.duration_seconds != null;

    const hlsUrl = isVideo && videoReady
      ? (streamId ? generateStreamHlsUrl(streamId) : (isHls ? src : undefined))
      : undefined;
    const mp4Url = isVideo && videoReady && !streamId && !isHls && src ? src : undefined;

    return {
      id: m.id,
      type: (isVideo ? 'video' : 'image') as 'video' | 'image',
      hlsUrl,
      mp4Url,
      // POSTER: fall back to the Stream thumbnail so a loading video shows a
      // still instead of a black frame.
      thumbnailUrl:
        m.poster_url ||
        (streamId ? generateStreamThumbnailUrl(streamId, { time: 0, height: 1080 }) : undefined),
      imageUrl: !isVideo ? src : undefined,
      streamId: streamId ?? undefined,
      width: m.width || 1080,
      height: m.height || 1920,
      duration: m.duration_seconds ?? undefined,
      displayOrder: m.display_order ?? idx,
      isProcessing: isVideo && !videoReady,
    };
  });

  // Build review object for the FeedPost.review field
  let review: ReviewData | null = null;
  if (reviewData) {
    review = {
      reviewId: reviewData.sourceReviewId || '',
      courseId: reviewData.courseId || '',
      courseName: reviewData.courseName || '',
      courseImageUrl: null,
      rating: reviewData.rating ?? 0,
      courseRegion: post.course?.region ?? null,
      courseCountry: post.course?.country ?? null,
      courseSubCountry: post.course?.sub_country ?? null,
      reviewText: post.content ?? null,
    };
  }

  // User mention tags were removed — always emit empty tags.
  // the ActivityPost shape, so we omit highlighting and pass an empty array).
  const tags = [] as FeedPost['tags'];

  return {
    id: post.id,
    userId: userData.id,
    actorType: 'personal',
    actorId: userData.id,
    username: userData.username ?? '',
    displayName: userData.name ?? '',
    avatarUrl: userData.avatar ?? '',
    isVerified: false,
    creatorRelation: 'none',
    caption: post.content ?? '',
    mediaItems,
    createdAt: post.created_at,
    likeCount: post.likes ?? 0,
    commentCount: post.comments ?? 0,
    shareCount: post.shares ?? 0,
    tags,
    courseName: reviewData?.courseName ?? post.course?.name,
    courseId: reviewData?.courseId ?? post.course?.id ?? post.course_id ?? undefined,
    review,
    isReview,
    isLikedByMe: false, // RPC lacks field
    isFollowedByMe: false, // RPC lacks field
    engagementScore: 0,
    handicapIndex: null,
    homeClub: null,
  };
}
