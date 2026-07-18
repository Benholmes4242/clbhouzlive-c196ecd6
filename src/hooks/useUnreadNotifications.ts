import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';

/**
 * Hook to check if the current actor has unread notifications.
 * Used for the bell icon badge in the header.
 *
 * Definition: unread = is_read false (scoped to the active actor).
 * Reading happens on Activity visit (auto-read) or per-row tap.
 * friend_request is excluded because those render in FriendRequestsRail
 * with their own lifecycle, not the ledger.
 *
 * Actor-aware: Returns notifications for the active actor (personal or business)
 */
export function useUnreadNotifications() {
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();

  const recipientActorType = activeActor?.type || 'personal';
  const recipientActorId = activeActor?.id || user?.id || '';

  const { data, error, isLoading } = useQuery({
    queryKey: ['activity-unread-count', recipientActorType, recipientActorId],
    queryFn: async () => {
      if (!user?.id || !recipientActorId) return 0;

      // Uses the RPC so the count applies the SAME predicate set as
      // get_activity_feed (muted_types/muted_user_ids, entity liveness),
      // preventing badge > visible-row-count drift.
      const { data, error: rpcErr } = await (supabase as any).rpc(
        'get_unread_notification_count',
        {
          p_user_id: user.id,
          p_actor_type: recipientActorType,
          p_actor_id: recipientActorId,
        },
      );
      if (rpcErr) throw rpcErr;
      return typeof data === 'number' ? data : 0;
    },

    enabled: !!user?.id && !!recipientActorId,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  return {
    hasUnread: (data ?? 0) > 0,
    unreadCount: data ?? 0,
    isLoading,
    error,
  };
}
