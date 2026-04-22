import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import { enforceCourseDiversity } from '@/components/media-system/utils/feedAlgorithm';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';
import type { ClipsMoodId } from './useClipsMood';

const MAX_DURATION = 30; // Lightning Round = ≤30s

/**
 * Lightning Round data path — clips ≤30 seconds, server-filtered via the new
 * `p_max_duration` parameter on get_watch_shorts. Reuses the existing
 * personalisation, ranking, and creator-quality pipeline; we just narrow
 * the duration window. Course-diversity is reapplied client-side for parity
 * with the rest of the Clips surface.
 */
export function useLightningRound(userId: string | undefined, mood: ClipsMoodId) {
  // Phase 4b: broken ternary fixed. 'trending' chip gets engagement-sorted,
  // all other moods get personalised 'for_you' within the 30s duration cap.
  const rpcMode = mood === 'trending' ? 'trending' : 'for_you';

  return useQuery({
    queryKey: ['clips-lightning-round', userId ?? null, mood],
    enabled: !!userId,
    queryFn: async (): Promise<FeedPost[]> => {
      if (!userId) return [];

      const { data, error } = await supabase.rpc('get_watch_shorts' as any, {
        p_user_id: userId,
        p_mode: rpcMode,
        p_page_size: 16,
        p_max_duration: MAX_DURATION,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useLightningRound] RPC error:', error);
          throw error;
        }
        return [];
      }

      const rows = (data as FeedRpcRow[] | null) ?? [];
      if (rows.length === 0) return [];

      const posts = groupMultiMedia(rows.map(mapRowToFeedPost));
      return enforceCourseDiversity(posts).slice(0, 8);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
