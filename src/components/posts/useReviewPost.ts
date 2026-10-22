/** Published review posts use the canonical feed mapper and grouping, so the
 * sheet opens the same engagement, review figures and carousel as Clubhouse.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { groupMultiMedia, mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import type { FeedRpcRow } from '@/components/media-system/types/media';

export function useReviewPost(reviewId: string | null | undefined, enabled: boolean) {
  const { activeActor } = useActiveActor();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  return useQuery({
    queryKey: ['review-post', reviewId, activeActor?.type ?? 'personal', activeActor?.id ?? userId ?? null],
    enabled: !!reviewId && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!reviewId) return null;
      const params = {
        p_review_id: reviewId,
        p_viewer_actor_type: activeActor?.type ?? 'personal',
        p_viewer_actor_id: activeActor?.id ?? userId,
      };
      const { data, error } = await supabase.rpc(
        'get_review_post',
        params as unknown as Parameters<typeof supabase.rpc<'get_review_post'>>[1],
      );
      if (error) throw error;
      const rows = (data ?? []) as unknown as FeedRpcRow[];
      return groupMultiMedia(rows.map(mapRowToFeedPost))[0] ?? null;
    },
  });
}