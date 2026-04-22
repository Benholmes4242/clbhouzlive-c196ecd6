import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

/**
 * Long-form videos by users the current viewer follows. Reuses the existing
 * get_long_form_videos RPC with p_mode='following' so the personalisation
 * pipeline + ranking stay intact. Hides gracefully if the user follows
 * nobody (or follows produce no recent long-form).
 */
export function useVideosFollowingRail(userId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ['videos-following-rail', userId ?? null, limit],
    enabled: !!userId,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!userId) return [];

      const { data, error } = await supabase.rpc('get_long_form_videos' as any, {
        p_user_id: userId,
        p_mode: 'following',
        p_page_size: limit,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useVideosFollowingRail] RPC error:', error);
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
