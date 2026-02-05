import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useActiveActor } from '@/context/ActiveActorContext';

/**
 * Hook to check if the current actor has unread notifications.
 * Used for the bell icon badge in the header.
 * 
 * Instagram-style logic:
 * - "Unread" = created after last_notifications_seen_at OR manually marked unread (is_read = false)
 * 
 * Actor-aware: Returns notifications for the active actor (personal or business)
 */
export function useUnreadNotifications() {
  const { user } = useSupabaseSession();
  const { data: userProfile } = useUserProfile(user?.id);
  const { activeActor } = useActiveActor();
  
  const lastNotificationsSeen = userProfile?.last_notifications_seen_at ?? null;
  
  // Get current actor context
  const recipientActorType = activeActor?.type || 'personal';
  const recipientActorId = activeActor?.id || user?.id || '';

  const { data, error, isLoading } = useQuery({
    queryKey: ['activity-unread-count', recipientActorType, recipientActorId, lastNotificationsSeen],
    queryFn: async () => {
      if (!user?.id || !recipientActorId) return 0;

      let count = 0;

      if (lastNotificationsSeen) {
        // Count items created after last seen for this actor
        const { count: newCount, error: newError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_actor_type', recipientActorType)
          .eq('recipient_actor_id', recipientActorId)
          .eq('is_deleted', false)
          .not('type', 'in', '("message","message_received","dm")')
          .gt('created_at', lastNotificationsSeen);

        if (newError) throw newError;

        // Also count manually marked unread that are OLDER than last seen
        const { count: unreadCount, error: unreadError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_actor_type', recipientActorType)
          .eq('recipient_actor_id', recipientActorId)
          .eq('is_deleted', false)
          .eq('is_read', false)
          .not('type', 'in', '("message","message_received","dm")')
          .lte('created_at', lastNotificationsSeen);

        if (unreadError) throw unreadError;

        count = (newCount || 0) + (unreadCount || 0);
      } else {
        // User has never visited notifications - count all unread for this actor
        const { count: allUnread, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_actor_type', recipientActorType)
          .eq('recipient_actor_id', recipientActorId)
          .eq('is_deleted', false)
          .eq('is_read', false)
          .not('type', 'in', '("message","message_received","dm")');

        if (error) throw error;
        count = allUnread ?? 0;
      }

      return count;
    },
    enabled: !!user?.id && !!recipientActorId,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return {
    hasUnread: (data ?? 0) > 0,
    unreadCount: data ?? 0,
    isLoading,
    error,
  };
}
