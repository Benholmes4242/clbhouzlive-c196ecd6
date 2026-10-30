/** Settings alone owns this head count. Member identity scopes the query;
 * blocked-user-ids invalidation refreshes it after existing block/unblock actions.
 * Unrun/loading/failed reads never expose stale or invented figures. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export function useSettingsBlockedCount(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['blocked-user-ids', userId, 'settings-count'],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { count, error } = await supabase.from('user_blocks').select('*', { count: 'exact', head: true }).eq('blocker_id', userId);
      if (error) throw error;
      return count;
    },
  });
  return userId && query.isSuccess && !query.isFetching && !query.isError ? query.data : null;
}