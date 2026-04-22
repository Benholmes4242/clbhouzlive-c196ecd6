import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

/**
 * Fetches long-form videos filtered by a single MOMENT_CATEGORIES id.
 * Used by the mood-driven Category rail (Course vlogs / Coaching / Tournaments).
 *
 * Powered by the new `p_category` parameter on get_long_form_videos.
 * Returns up to `limit` posts ordered by recency. Hides gracefully on empty.
 */
export function useVideosCategoryRail(
  userId: string | undefined,
  category: string | null,
  limit = 8,
) {
  return useQuery({
    queryKey: ['videos-category-rail', userId ?? null, category, limit],
    enabled: !!userId && !!category,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!userId || !category) return [];

      const { data, error } = await supabase.rpc('get_long_form_videos' as any, {
        p_user_id: userId,
        p_mode: 'latest',
        p_page_size: limit,
        p_category: category,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useVideosCategoryRail] RPC error:', error);
          throw error;
        }
        return [];
      }

      const rows = (data as FeedRpcRow[] | null) ?? [];
      if (rows.length === 0) return [];

      return groupMultiMedia(rows.map(mapRowToFeedPost));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
