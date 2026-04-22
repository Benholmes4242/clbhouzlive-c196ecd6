import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

/**
 * Fetch a fixed set of posts by ID for the course-anchored rail.
 *
 * Implementation: queries posts + post_media via PostgREST embed (FK exists),
 * then fetches user_profiles and golf_courses in parallel via separate
 * queries. We avoid PostgREST embeds for those two tables because no FK
 * constraint is declared on posts.user_id / posts.course_id, which would
 * trigger PGRST200 ("Could not find a relationship") errors. Each query
 * goes through the authenticated client so RLS policies apply individually.
 */
export function useFeedPostsByIds(postIds: string[] | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['watch-feed-posts-by-ids', (postIds ?? []).slice().sort().join(','), userId],
    enabled: !!postIds && postIds.length > 0,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!postIds || postIds.length === 0) return [];

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
          )
        `)
        .in('id', postIds)
        .eq('status', 'published');

      if (error) {
        if (import.meta.env.DEV) console.error('[useFeedPostsByIds] posts error:', error);
        return [];
      }

      const postRows = (rows as any[]) ?? [];
      if (postRows.length === 0) return [];

      const userIds = Array.from(
        new Set(postRows.map((p) => p.user_id).filter(Boolean) as string[])
      );
      const courseIds = Array.from(
        new Set(postRows.map((p) => p.course_id).filter(Boolean) as string[])
      );

      // Fetch profiles + courses in parallel. Empty-input cases short-circuit
      // to a resolved empty result so the mapping path is uniform.
      const [profilesRes, coursesRes] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from('user_profiles')
              .select('id, username, display_name, profile_photo_url, is_verified')
              .in('id', userIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        courseIds.length > 0
          ? supabase
              .from('golf_courses')
              .select('id, name')
              .in('id', courseIds)
          : Promise.resolve({ data: [] as any[], error: null }),
      ]);

      if (profilesRes.error && import.meta.env.DEV) {
        console.error('[useFeedPostsByIds] profiles error:', profilesRes.error);
      }
      if (coursesRes.error && import.meta.env.DEV) {
        console.error('[useFeedPostsByIds] courses error:', coursesRes.error);
      }

      const profileMap = new Map<string, any>();
      for (const p of (profilesRes.data as any[]) ?? []) {
        if (p?.id) profileMap.set(p.id, p);
      }
      const courseMap = new Map<string, any>();
      for (const c of (coursesRes.data as any[]) ?? []) {
        if (c?.id) courseMap.set(c.id, c);
      }

      // One row per (post, media) pair so groupMultiMedia can collapse them.
      const flatRows: FeedRpcRow[] = [];
      for (const post of postRows) {
        const media: any[] = post.post_media ?? [];
        const profile = profileMap.get(post.user_id) ?? {};
        const course = post.course_id ? courseMap.get(post.course_id) ?? {} : {};
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
