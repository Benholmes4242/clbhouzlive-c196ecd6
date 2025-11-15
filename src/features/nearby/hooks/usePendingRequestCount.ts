import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePendingRequestCount(gameId: string) {
  return useQuery({
    queryKey: ['pendingRequestCount', gameId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('game_join_requests')
        .select('id', { count: 'exact', head: true })
        .eq('game_id', gameId)
        .eq('status', 'pending');

      if (error) {
        console.error('[usePendingRequestCount] Error:', error);
        return 0;
      }

      return count ?? 0;
    },
    enabled: !!gameId,
  });
}
