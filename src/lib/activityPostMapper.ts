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

export function mapActivityPostToFeedPost(post: ActivityPost): FeedPost {
  const userData = extractUserData(post);
  const isReview = isReviewPost(post);
  const reviewData = isReview ? extractReviewData(post) : null;

  // Map media array — ActivityPost stores resolved URLs in media_url.
  // For videos, .m3u8 → hlsUrl, otherwise → mp4Url. Mirrors useMediaViewer.normalizeItem.
  const mediaItems: MediaItem[] = (post.post_media || []).map((m, idx) => {
    const isVideo = m.media_type === 'video';
    const src = m.media_url || '';
    const isHls = isVideo && src.includes('.m3u8');
    return {
      id: m.id,
      type: (isVideo ? 'video' : 'image') as 'video' | 'image',
      hlsUrl: isVideo && isHls ? src : undefined,
      mp4Url: isVideo && !isHls ? src : undefined,
      thumbnailUrl: m.poster_url || undefined,
      imageUrl: !isVideo ? src : undefined,
      width: m.width || 1080,
      height: m.height || 1920,
      duration: m.duration_seconds ?? undefined,
      displayOrder: idx,
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

  // Map post_tags → FeedPostTag[] (start_index / end_index aren't available on
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
    isLikedByMe: false,
    isFollowedByMe: false,
    engagementScore: 0,
    handicapIndex: null,
    homeClub: null,
  };
}
