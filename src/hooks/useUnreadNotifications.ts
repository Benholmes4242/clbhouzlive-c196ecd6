import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Hook to check if the current user has unread notifications.
 * Used for the bell icon badge in the header.
 * 
 * Instagram-style logic:
 * - "Unread" = created after last_notifications_seen_at OR manually marked unread (is_read = false)
 */
export function useUnreadNotifications() {
  const { user } = useSupabaseSession();
  const { data: userProfile } = useUserProfile(user?.id);
  
  const lastNotificationsSeen = userProfile?.last_notifications_seen_at ?? null;

  const { data, error, isLoading } = useQuery({
    queryKey: ['activity-unread-count', user?.id, lastNotificationsSeen],
    queryFn: async () => {
      if (!user?.id) return 0;

      let count = 0;

      if (lastNotificationsSeen) {
        // Count items created after last seen
        const { count: newCount, error: newError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .gt('created_at', lastNotificationsSeen);

        if (newError) throw newError;

        // Also count manually marked unread that are OLDER than last seen
        const { count: unreadCount, error: unreadError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('is_read', false)
          .lte('created_at', lastNotificationsSeen);

        if (unreadError) throw unreadError;

        count = (newCount || 0) + (unreadCount || 0);
      } else {
        // User has never visited notifications - count all unread
        const { count: allUnread, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('is_read', false);

        if (error) throw error;
        count = allUnread ?? 0;
      }

      return count;
    },
    enabled: !!user?.id,
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
