/**
 * useTotalPendingHostRequests - Get total pending requests across all games a user hosts
 * 
 * Uses game_participants.rsvp_status='requested' as single source of truth
 */
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type HostGame = {
  id: string;
  host_user_id: string;
};

export function useTotalPendingHostRequests(
  games: HostGame[] | undefined,
  currentUserId: string | undefined
) {
  const hostingGames = games?.filter(g => g.host_user_id === currentUserId) ?? [];

  const queries = useQueries({
    queries: hostingGames.map((game) => ({
      queryKey: ['pendingRequestCount', game.id],
      queryFn: async () => {
        const { count, error } = await supabase
          .from('game_participants')
          .select('id', { count: 'exact', head: true })
          .eq('game_id', game.id)
          .eq('rsvp_status', 'requested');

        if (error) {
          console.error('[useTotalPendingHostRequests] Error:', error);
          return 0;
        }

        return count ?? 0;
      },
      enabled: !!game.id && !!currentUserId,
    })),
  });

  return queries.reduce((sum, query) => sum + (query.data ?? 0), 0);
}
