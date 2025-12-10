import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

/**
 * Hook to check if the current user has unread notifications.
 * Used for the bell icon badge in the header.
 */
export function useUnreadNotifications() {
  const { user } = useSupabaseSession();

  const { data, error, isLoading } = useQuery({
    queryKey: ['activity-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
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
