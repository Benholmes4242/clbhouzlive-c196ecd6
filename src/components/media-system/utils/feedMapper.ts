import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import type { FeedPost, FeedRpcRow, MediaItem, ReviewData, CreatorRelation, FeedPostTag } from '../types/media';
import { isPortraitAdmissible } from './mediaOrientation';

// LEGACY FALLBACK ONLY. The feed RPCs project post_media.stream_id, which is
// the primary source of a Cloudflare Stream uid. This pattern exists only for
// legacy video rows whose stream_id is null. It is consulted for VIDEO rows
// only (enforced in mapRowToFeedPost), accepts a 32-hex uid only when it is
// the WHOLE value after a `stream:` prefix or a whole path segment — never an
// arbitrary 32-hex substring, since storage object ids / dash-stripped UUIDs
// are also 32-hex — and emits a console.warn every time it fires so a broken
// projection is loud instead of silently covered.
const UID_RE = /^(?:stream:)?([0-9a-f]{32})$/i;

function buildHlsUrl(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/manifest/video.m3u8`;
}


function buildThumbnailUrl(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=1080`;
}

export function extractStreamId(mediaUrl: string): string | null {
  if (!mediaUrl) return null;
  const whole = mediaUrl.trim().match(UID_RE);
  if (whole) return whole[1];
  // Whole path segment of a URL (e.g. https://host/<uid>/manifest/video.m3u8).
  let path = mediaUrl;
  try { path = new URL(mediaUrl).pathname; } catch { /* not a URL */ }
  for (const seg of path.split('/')) {
    if (/^[0-9a-f]{32}$/i.test(seg)) return seg;
  }
  return null;
}

/**
 * Map a raw DB row from get_suggested_feed or get_friends_feed to a FeedPost.
 * This is the ONLY place where DB column names are referenced.
 */
export function mapRowToFeedPost(row: FeedRpcRow): FeedPost {
  let streamId: string | null = row.stream_id || null;
  if (!streamId && row.media_type === 'video') {
    streamId = extractStreamId(row.media_url || '');
    if (streamId) {
      console.warn('[feedMapper] stream_id missing from RPC, recovered from media_url', {
        postId: row.post_id,
        mediaId: row.media_id,
      });
    }
  }
  const isReview = !!row.source_review_id;
  const isBusiness = row.post_actor_type === 'business';
  const isVideo = row.media_type === 'video';
  // A video is playable only once Cloudflare has finished encoding.
  // duration_seconds is null until the cloudflare-stream-webhook stamps it,
  // so it's the reliable readiness proxy. Handing the player a manifest
  // before then triggers a 424 (not readyToStream) console-error storm.
  const videoReady = isVideo && row.duration_seconds != null;

  const mediaItem: MediaItem = {
    id: row.media_id,
    type: isVideo ? 'video' : 'image',
    // Only ready videos get a manifest URL. Not-ready videos fall through to
    // the poster fallback in FeedSlide / consumers without a load attempt.
    // IMAGE ROWS NEVER GET AN hlsUrl — see UID_RE comment above.
    hlsUrl: isVideo && videoReady && streamId ? buildHlsUrl(streamId) : undefined,
    // mp4Url intentionally undefined: /downloads/default.mp4 404s (Cloudflare MP4
    // downloads not enabled). HLS is the always-present primary path.
    mp4Url: undefined,
    thumbnailUrl: row.poster_url || (streamId ? buildThumbnailUrl(streamId) : undefined),
    imageUrl: row.media_type === 'image' ? row.media_url : undefined,
    // Threaded through so AnimatedTileThumb can request the animated variant.
    streamId: streamId ?? undefined,
    width: row.width || 1080,
    height: row.height
      || (row.aspect_ratio && Number(row.aspect_ratio) > 0
        ? Math.round((row.width || 1080) / Number(row.aspect_ratio))
        : 1920),
    duration: row.duration_seconds ? Number(row.duration_seconds) : undefined,
    displayOrder: row.display_order || 0,
    isProcessing: isVideo && !videoReady,
  };

  let review: ReviewData | null = null;
  // Fall back to the post's own course_id/course_name when the RPC didn't
  // flatten review_course_* columns — this keeps the fullscreen "read review ›"
  // CTA visible on every review-sourced surface (Watch mixed grid included).
  const reviewCourseId = row.review_course_id || row.course_id || null;
  const reviewCourseName = row.review_course_name || row.course_name || null;
  if (isReview && reviewCourseId) {
    review = {
      reviewId: row.source_review_id,
      courseId: reviewCourseId,
      courseName: reviewCourseName || 'Unknown Course',
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
    courseCountry: row.review_course_country || row.course_country || undefined,
    courseRegion: row.review_course_region || row.course_region || undefined,
    courseSubCountry: row.review_course_sub_country || undefined,
    courseRating: row.course_avg_overall_score != null ? Number(row.course_avg_overall_score) : null,
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
export function groupMultiMedia(
  posts: FeedPost[],
  options?: { portraitOnly?: boolean },
): FeedPost[] {
  const portraitOnly = options?.portraitOnly ?? false;
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
      if (!item.id || seenIds.has(item.id)) return false;       // dedupe (unchanged)
      seenIds.add(item.id);
      if (portraitOnly && !isPortraitAdmissible(item)) return false; // NEW: drop landscape
      return true;
    });
  }
  const grouped = Array.from(map.values());
  // NEW: drop posts/reviews left with zero admissible media (only when filtering)
  return portraitOnly
    ? grouped.filter(post => post.mediaItems.length > 0)
    : grouped;
}
