import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GAME_NOTIF_TYPES } from '../components/ledgerKinds';

/**
 * Unread count for the Records chip (BRIEF_RECORDS_TAB_COUNT_AND_READ_SCOPE §2).
 *
 * WHY NOT buckets.new.length: the New chip counts rows already on screen so the
 * chip and the tab can never disagree. That cannot transfer here —
 * get_activity_feed EXCLUDES the game family from every filter except
 * p_filter='crowns', so the All tab's rows contain zero Records rows. The count
 * has to be its own head query.
 *
 * Looser than get_activity_feed by design: no mute or liveness predicates.
 * Game notifications carry no actor_id and no post/comment entity, so
 * muted_user_ids and the liveness joins cannot exclude any of them. Only
 * muted_types could, and a member who has muted a game type would see a
 * count they cannot clear — if that is ever reported, add the muted_types
 * check here rather than fetching rows.
 */
export function useRecordsUnreadCount(
  recipientActorType: 'personal' | 'business',
  recipientActorId: string,
) {
  return useQuery({
    queryKey: ['records-unread-count', recipientActorType, recipientActorId],
    enabled: !!recipientActorId,
    staleTime: 30_000,
    queryFn: async () => {
      // head: true — the count comes back with NO rows.
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_actor_type', recipientActorType)
        .eq('recipient_actor_id', recipientActorId)
        .eq('is_deleted', false)
        .eq('is_read', false)
        .in('type', GAME_NOTIF_TYPES as unknown as string[]);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
