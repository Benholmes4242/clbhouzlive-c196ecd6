import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';
import type { FeedPost, FeedRpcRow, MediaItem, ReviewData, CreatorRelation, FeedPostTag } from '../types/media';

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
export function mapRowToFeedPost(row: FeedRpcRow): FeedPost {
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
      reviewText: row.review_text ?? null,
      breakdown: {
        design: row.review_design_score != null ? Number(row.review_design_score) : null,
        conditions: row.review_condition_score != null ? Number(row.review_condition_score) : null,
        clubhouse: row.review_clubhouse_score != null ? Number(row.review_clubhouse_score) : null,
        facilities: row.review_facilities_score != null ? Number(row.review_facilities_score) : null,
      },
    };
  }

  const rawTags = (() => {
    if (!row.post_tags) return [];
    if (Array.isArray(row.post_tags)) return row.post_tags;
    if (typeof row.post_tags === 'string') {
      try { return JSON.parse(row.post_tags); } catch { return []; }
    }
    return [];
  })();

  const tags: FeedPostTag[] = rawTags
    .filter((tag: any) => tag && tag.entity_type && tag.entity_id)
    .map((tag: any) => ({
      id: tag.id ?? '',
      entity_type: tag.entity_type,
      entity_id: tag.entity_id,
      name: tag.name ?? '',
      username: tag.username ?? null,
      start_index: tag.start_index ?? 0,
      end_index: tag.end_index ?? 0,
    }));

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
    tags,
    courseName: row.review_course_name || row.course_name || undefined,
    courseId: row.review_course_id || row.course_id || undefined,
    courseCountry: row.review_course_country || undefined,
    courseThumbnailImage: row.course_thumbnail_image ?? null,
    courseLatitude: row.course_latitude ?? null,
    courseLongitude: row.course_longitude ?? null,
    courseGlobalRank: row.course_global_rank ?? null,
    review,
    isReview,
    isLikedByMe: !!row.is_liked_by_me,
    isFollowedByMe: !!row.is_followed_by_me,
    // Phase 1 personalisation signals
    mutualFriendsCount: row.mutual_friends_count ?? 0,
    countryMatch: row.country_match ?? false,
    top100ListMatch: row.top100_list_match ?? false,
    ratedPostCourse: row.rated_post_course ?? false,
    engagementScore: Number(row.engagement_score) || 0,
    // Privacy-aware identity surfacing
    handicapIndex:
      row.creator_show_handicap !== false &&
      row.creator_handicap_index !== null &&
      row.creator_handicap_index !== undefined
        ? Number(row.creator_handicap_index)
        : null,
    homeClub:
      row.creator_home_club_visibility === 'public' && row.creator_home_club
        ? row.creator_home_club
        : null,
  };
}

/**
 * Groups posts sharing the same `id` and merges their `mediaItems`.
 *
 * IMPORTANT — pure function. Does NOT mutate input. The input may be a
 * React Query cache reference (see useCourseMedia.ts:97 — calls this in
 * a useMemo over query.data.pages). A previous version of this function
 * mutated the shared mediaItems arrays via `.push(...)` and shallow spread,
 * which compounded across re-evaluations of the useMemo and caused the
 * displayed media count to grow on every Course Media tab navigation.
 *
 * Always clone arrays before reassigning. Always reassign — never .push.
 */
export function groupMultiMedia(posts: FeedPost[]): FeedPost[] {
  const map = new Map<string, FeedPost>();
  for (const post of posts) {
    const existing = map.get(post.id);
    if (existing) {
      // Reassign with a NEW array — do not mutate the existing one
      existing.mediaItems = [...existing.mediaItems, ...post.mediaItems];
    } else {
      // Clone mediaItems — do not share reference with input
      map.set(post.id, { ...post, mediaItems: [...post.mediaItems] });
    }
  }
  for (const post of map.values()) {
    // Safe: post.mediaItems is owned by us (cloned/reassigned above)
    post.mediaItems.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const seenIds = new Set<string>();
    post.mediaItems = post.mediaItems.filter(item => {
      if (!item.id || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }
  return Array.from(map.values());
}
