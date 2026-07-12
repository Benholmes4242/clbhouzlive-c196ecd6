/**
 * Adapts a raw row from a Watch hub RPC (get_watch_mixed_grid,
 * get_long_form_videos, get_watch_shorts) into a FeedPost so the shared
 * media-system machinery (RailLanePool / openWithOrigin / fullscreen viewer)
 * can consume it.
 *
 * The three RPCs return overlapping but non-identical column sets; we spread
 * FeedRpcRow-shaped defaults FIRST, then the row on top, so `mapRowToFeedPost`
 * always receives a complete row regardless of which RPC produced it.
 *
 * Defaulted fields (any not returned by every hub RPC):
 *   post_user_id, post_actor_type, post_actor_id, post_status, source_review_id,
 *   media_id, media_type, media_url, display_order,
 *   creator_is_verified, business_name, business_logo_url, business_is_verified,
 *   like_count, comment_count, share_count,
 *   review_rating, review_course_id, review_course_name, review_course_image,
 *   creator_relation, is_liked_by_me, is_followed_by_me, engagement_score.
 *
 * NOTE: we intentionally map 1:1 (no groupMultiMedia) — index alignment with
 * the rendered tiles is load-bearing for useWatchAutoplay's data-watch-tile-index
 * and every hub RPC returns exactly one media per row.
 */
import { mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

function rowDefaults(row: any): FeedRpcRow {
  return {
    post_id: row.post_id,
    post_content: row.post_content ?? null,
    post_created_at: row.post_created_at ?? new Date(0).toISOString(),
    post_user_id: row.post_user_id ?? row.actor_id ?? '',
    post_actor_type: row.post_actor_type ?? row.actor_type ?? 'personal',
    post_actor_id: row.post_actor_id ?? row.actor_id ?? null,
    post_status: row.post_status ?? 'published',
    source_review_id: row.source_review_id ?? row.review_id ?? null,
    media_id: row.media_id ?? row.post_id,
    media_type: row.media_type ?? 'video',
    media_url: row.media_url ?? null,
    poster_url: row.poster_url ?? null,
    stream_id: row.stream_id ?? null,
    duration_seconds: row.duration_seconds ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    display_order: row.display_order ?? 0,
    creator_username: row.creator_username ?? null,
    creator_display_name: row.creator_display_name ?? null,
    creator_avatar_url: row.creator_avatar_url ?? null,
    creator_is_verified: !!row.creator_is_verified,
    business_name: row.business_name ?? null,
    business_logo_url: row.business_logo_url ?? null,
    business_is_verified: !!row.business_is_verified,
    like_count: Number(row.like_count ?? 0),
    comment_count: Number(row.comment_count ?? 0),
    share_count: Number(row.share_count ?? 0),
    review_rating: row.review_rating ?? row.review_overall_score ?? null,
    review_course_id: row.review_course_id ?? null,
    review_course_name: row.review_course_name ?? null,
    review_course_image: row.review_course_image ?? null,
    creator_relation: row.creator_relation ?? 'none',
    is_liked_by_me: !!row.is_liked_by_me,
    is_followed_by_me: !!row.is_followed_by_me,
    engagement_score: Number(row.engagement_score ?? 0),
    post_tags: row.post_tags ?? null,
    course_id: row.course_id ?? null,
    course_name: row.course_name ?? null,
  };
}

export function toFeedPosts(rows: any[]): FeedPost[] {
  return (rows ?? []).map((row) => mapRowToFeedPost(rowDefaults(row)));
}

export default toFeedPosts;
