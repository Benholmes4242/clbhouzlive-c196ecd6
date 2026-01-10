/**
 * usePendingRequestCount - Get count of pending join requests for a game
 * 
 * Uses game_participants.rsvp_status='requested' as single source of truth
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePendingRequestCount(gameId: string) {
  return useQuery({
    queryKey: ['pendingRequestCount', gameId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('game_participants')
        .select('id', { count: 'exact', head: true })
        .eq('game_id', gameId)
        .eq('rsvp_status', 'requested');

      if (error) {
        console.error('[usePendingRequestCount] Error:', error);
        return 0;
      }

      return count ?? 0;
    },
    enabled: !!gameId,
  });
}
