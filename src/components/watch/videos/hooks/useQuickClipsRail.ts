import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

/**
 * Tiny isolated hook that fetches a short, fixed set of trending shorts
 * for the Videos subpage "Quick clips" rail. Uses its OWN query key so it
 * does not share/consume the clips subpage's `seen-ids` state via the
 * `useWatchFeed` hook.
 */
export function useQuickClipsRail(userId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ['quick-clips-rail', userId, limit],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_watch_shorts', {
        p_user_id: userId,
        p_mode: 'trending',
        p_page_size: limit,
      } as any);
      if (error || !data) return [];
      const rows = data as unknown as FeedRpcRow[];
      return groupMultiMedia(rows.map(mapRowToFeedPost));
    },
  });
}
