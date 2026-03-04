import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';
import type { FeedPost, MediaItem, ReviewData, CreatorRelation } from '../types/media';

const UID_RE = /([0-9a-f]{32})/i;

function buildHlsUrl(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/manifest/video.m3u8`;
}

function buildMp4Url(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/downloads/default.mp4`;
}

function buildThumbnailUrl(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=1080`;
}

function extractStreamId(mediaUrl: string): string | null {
  if (!mediaUrl) return null;
  return mediaUrl.match(UID_RE)?.[1] ?? null;
}

/**
 * Map a raw DB row from get_suggested_feed or get_friends_feed to a FeedPost.
 * This is the ONLY place where DB column names are referenced.
 */
export function mapRowToFeedPost(row: any): FeedPost {
  const streamId = row.stream_id || extractStreamId(row.media_url || '');
  const isReview = !!row.source_review_id;
  const isBusiness = row.post_actor_type === 'business';

  const mediaItem: MediaItem = {
    id: row.media_id,
    type: row.media_type === 'video' ? 'video' : 'image',
    hlsUrl: streamId ? buildHlsUrl(streamId) : undefined,
    mp4Url: streamId ? buildMp4Url(streamId) : undefined,
    thumbnailUrl: row.poster_url || (streamId ? buildThumbnailUrl(streamId) : undefined),
    imageUrl: row.media_type === 'image' ? row.media_url : undefined,
    width: row.width || 1080,
    height: row.height || 1920,
    duration: row.duration_seconds ? Number(row.duration_seconds) : undefined,
    displayOrder: row.display_order || 0,
  };

  let review: ReviewData | null = null;
  if (isReview && row.review_course_id) {
    review = {
      reviewId: row.source_review_id,
      courseId: row.review_course_id,
      courseName: row.review_course_name || 'Unknown Course',
      courseImageUrl: row.review_course_image || null,
      rating: Number(row.review_rating) || 0,
      courseRegion: row.review_course_region || null,
      courseCountry: row.review_course_country || null,
      courseSubCountry: row.review_course_sub_country || null,
    };
  }

  return {
    id: row.post_id,
    userId: row.post_user_id,
    actorType: (row.post_actor_type || 'personal') as 'personal' | 'business',
    actorId: row.post_actor_id || row.post_user_id,
    username: isBusiness
      ? (row.business_name || row.creator_username || '')
      : (row.creator_username || ''),
    displayName: isBusiness
      ? (row.business_name || row.creator_display_name || '')
      : (row.creator_display_name || row.creator_username || ''),
    avatarUrl: isBusiness
      ? (row.business_logo_url || '')
      : (row.creator_avatar_url || ''),
    isVerified: isBusiness
      ? !!row.business_is_verified
      : !!row.creator_is_verified,
    creatorRelation: (row.creator_relation || 'none') as CreatorRelation,
    caption: row.post_content || '',
    mediaItems: [mediaItem],
    createdAt: row.post_created_at,
    likeCount: Number(row.like_count) || 0,
    commentCount: Number(row.comment_count) || 0,
    shareCount: Number(row.share_count) || 0,
    review,
    isReview,
    isLikedByMe: !!row.is_liked_by_me,
    isFollowedByMe: !!row.is_followed_by_me,
  };
}

/**
 * Group multi-media posts: merge rows with the same post_id into one FeedPost.
 */
export function groupMultiMedia(posts: FeedPost[]): FeedPost[] {
  const map = new Map<string, FeedPost>();
  for (const post of posts) {
    if (map.has(post.id)) {
      map.get(post.id)!.mediaItems.push(...post.mediaItems);
    } else {
      map.set(post.id, { ...post });
    }
  }
  for (const post of map.values()) {
    post.mediaItems.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }
  return Array.from(map.values());
}
