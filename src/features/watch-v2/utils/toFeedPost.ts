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
 * NOTE: we intentionally map 1:1 (no groupMultiMedia) - index alignment with
 * the rendered tiles is load-bearing for useWatchAutoplay's data-watch-tile-index
 * and every hub RPC returns exactly one media per row.
 */
import { mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

/**
 * Union-shaped row emitted by any of the Watch hub RPCs. All fields are
 * optional because each RPC returns a subset - `rowDefaults` fills gaps.
 */
export interface HubRpcRow {
  post_id: string;
  post_content?: string | null;
  post_created_at?: string | null;
  post_user_id?: string | null;
  post_actor_type?: string | null;
  post_actor_id?: string | null;
  actor_id?: string | null;
  actor_type?: string | null;
  post_status?: string | null;
  source_review_id?: string | null;
  review_id?: string | null;
  media_id?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  poster_url?: string | null;
  stream_id?: string | null;
  duration_seconds?: number | null;
  width?: number | null;
  height?: number | null;
  display_order?: number | null;
  creator_username?: string | null;
  creator_display_name?: string | null;
  creator_avatar_url?: string | null;
  creator_is_verified?: boolean | null;
  business_name?: string | null;
  business_logo_url?: string | null;
  business_is_verified?: boolean | null;
  like_count?: number | null;
  comment_count?: number | null;
  share_count?: number | null;
  review_rating?: number | null;
  review_overall_score?: number | null;
  review_course_id?: string | null;
  review_course_name?: string | null;
  review_course_image?: string | null;
  creator_relation?: string | null;
  is_liked_by_me?: boolean | null;
  is_followed_by_me?: boolean | null;
  engagement_score?: number | null;
  post_tags?: unknown;
  course_id?: string | null;
  course_name?: string | null;
  derived_format?: string | null;
}

function rowDefaults(row: HubRpcRow): FeedRpcRow {
  return {
    post_id: row.post_id,
    post_content: row.post_content ?? null,
    post_created_at: row.post_created_at ?? new Date(0).toISOString(),
    post_user_id: row.post_user_id ?? row.actor_id ?? '',
    post_actor_type: (row.post_actor_type ?? row.actor_type ?? 'personal') as FeedRpcRow['post_actor_type'],
    post_actor_id: row.post_actor_id ?? row.actor_id ?? null,
    post_status: (row.post_status ?? 'published') as FeedRpcRow['post_status'],
    source_review_id: row.source_review_id ?? row.review_id ?? null,
    media_id: row.media_id ?? row.post_id,
    media_type: (row.media_type ?? 'video') as FeedRpcRow['media_type'],
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
    creator_relation: (row.creator_relation ?? 'none') as FeedRpcRow['creator_relation'],
    is_liked_by_me: !!row.is_liked_by_me,
    is_followed_by_me: !!row.is_followed_by_me,
    engagement_score: Number(row.engagement_score ?? 0),
    post_tags: (row.post_tags ?? null) as FeedRpcRow['post_tags'],
    course_id: row.course_id ?? null,
    course_name: row.course_name ?? null,
  };
}

export function toFeedPosts(rows: HubRpcRow[]): FeedPost[] {
  return (rows ?? []).map((row) => mapRowToFeedPost(rowDefaults(row)));
}

export default toFeedPosts;
