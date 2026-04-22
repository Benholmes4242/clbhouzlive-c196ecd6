import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

/**
 * Fetch a fixed set of posts by ID using the canonical get_watch_shorts RPC
 * with mode='by_ids'. If that mode isn't supported by the RPC, falls back
 * to fetching nothing (rail will hide). The course-anchored rail uses this
 * to render real WatchTile components from the IDs returned by
 * get_user_course_anchored_content.
 *
 * Implementation note: rather than add yet another RPC, we just query the
 * underlying posts + post_media + user_profiles via PostgREST directly and
 * map them into the FeedPost shape. This avoids needing a new SECURITY
 * DEFINER function and respects existing RLS on posts.
 */
export function useFeedPostsByIds(postIds: string[] | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['watch-feed-posts-by-ids', (postIds ?? []).slice().sort().join(','), userId],
    enabled: !!postIds && postIds.length > 0,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!postIds || postIds.length === 0) return [];

      // Fetch posts with embedded media + creator profile.
      const { data: rows, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          created_at,
          like_count,
          comment_count,
          course_id,
          actor_type,
          actor_id,
          post_media!inner (
            id, media_type, media_url, hls_url, poster_url, stream_id,
            width, height, duration_seconds, display_order,
            derived_format, processing_status
          ),
          user_profiles!posts_user_id_fkey (
            username, display_name, profile_photo_url, is_verified
          ),
          golf_courses (
            id, name
          )
        `)
        .in('id', postIds)
        .eq('status', 'published');

      if (error) {
        if (import.meta.env.DEV) console.error('[useFeedPostsByIds] error:', error);
        return [];
      }

      // Adapt the nested PostgREST shape into the flat FeedRpcRow shape the
      // mapper expects. One row per (post, media) pair so groupMultiMedia
      // can collapse them.
      const flatRows: FeedRpcRow[] = [];
      for (const post of (rows as any[]) ?? []) {
        const media: any[] = post.post_media ?? [];
        const profile = post.user_profiles ?? {};
        const course = post.golf_courses ?? {};
        if (media.length === 0) continue;
        for (const m of media) {
          // Phase 4b: skip media that isn't ready for feeds
          if (m.processing_status !== 'complete') continue;
          if (!m.derived_format) continue;
          flatRows.push({
            post_id: post.id,
            post_user_id: post.user_id,
            post_content: post.content ?? '',
            post_created_at: post.created_at,
            actor_type: post.actor_type ?? 'personal',
            actor_id: post.actor_id ?? post.user_id,
            creator_username: profile.username ?? null,
            creator_display_name: profile.display_name ?? null,
            creator_avatar_url: profile.profile_photo_url ?? null,
            creator_is_verified: !!profile.is_verified,
            creator_relation: 'none',
            course_id: post.course_id ?? null,
            course_name: course.name ?? null,
            media_id: m.id,
            media_type: m.media_type,
            media_url: m.media_url,
            hls_url: m.hls_url ?? m.media_url,
            poster_url: m.poster_url,
            stream_id: m.stream_id,
            width: m.width,
            height: m.height,
            duration_seconds: m.duration_seconds,
            display_order: m.display_order,
            like_count: post.like_count ?? 0,
            comment_count: post.comment_count ?? 0,
            share_count: 0,
            is_liked_by_me: false,
            is_followed_by_me: false,
            review_id: null,
            review_overall_score: null,
            review_categories: null,
          } as unknown as FeedRpcRow);
        }
      }

      const grouped = groupMultiMedia(flatRows.map(mapRowToFeedPost));

      // Preserve requested order.
      const orderMap = new Map(postIds.map((id, idx) => [id, idx]));
      return grouped.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
