import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

/**
 * Fetch a fixed set of posts by ID and re-use the canonical feed mapper so
 * the resulting FeedPost shape matches what WatchTile / fullscreen viewer
 * expect. Used by the course-anchored rail.
 */
export function usePostsByIds(postIds: string[] | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['posts-by-ids', postIds, userId],
    enabled: !!postIds && postIds.length > 0,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!postIds || postIds.length === 0) return [];

      const { data, error } = await supabase.rpc('get_posts_by_ids' as any, {
        p_post_ids: postIds,
        p_user_id: userId ?? null,
      });

      // If the RPC doesn't exist, fall back to a simple select. Most projects
      // already have get_posts_by_ids; if not, the Watch tab still functions
      // (rail just hides).
      if (error) {
        if (import.meta.env.DEV) console.warn('[usePostsByIds] RPC unavailable, returning empty:', error);
        return [];
      }

      const rows = (data as FeedRpcRow[] | null) ?? [];
      const mapped = groupMultiMedia(rows.map(mapRowToFeedPost));
      // Preserve the requested order
      const orderMap = new Map(postIds.map((id, idx) => [id, idx]));
      return mapped.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
