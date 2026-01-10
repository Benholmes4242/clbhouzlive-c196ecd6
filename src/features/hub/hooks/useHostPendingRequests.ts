/**
 * useHostPendingRequests - Fetches all pending join requests for games the current user hosts
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PendingRequest {
  id: string;
  game_id: string;
  requester_user_id: string;
  status: string;
  created_at: string;
  game: {
    id: string;
    course_name: string;
    start_time: string | null;
  };
  requester: {
    id: string;
    display_name: string;
    profile_photo_url: string | null;
    home_club: string | null;
    eg_handicap_index: number | null;
  };
}

export function useHostPendingRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hostPendingRequests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all games where user is host
      const { data: hostedGames, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .eq('host_user_id', user.id)
        .eq('status', 'active');

      if (gamesError) {
        console.error('[useHostPendingRequests] Error fetching hosted games:', gamesError);
        return [];
      }

      if (!hostedGames || hostedGames.length === 0) return [];

      const gameIds = hostedGames.map(g => g.id);

      // Get all pending requests for those games
      const { data: requests, error: requestsError } = await supabase
        .from('game_join_requests')
        .select(`
          id,
          game_id,
          requester_user_id,
          status,
          created_at
        `)
        .in('game_id', gameIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('[useHostPendingRequests] Error fetching requests:', requestsError);
        return [];
      }

      if (!requests || requests.length === 0) return [];

      // Fetch game details
      const { data: games } = await supabase
        .from('games')
        .select('id, course_name, start_time')
        .in('id', requests.map(r => r.game_id));

      // Fetch requester profiles
      const requesterIds = [...new Set(requests.map(r => r.requester_user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url, home_club, eg_handicap_index')
        .in('id', requesterIds);

      const gamesMap = new Map(games?.map(g => [g.id, g]) || []);
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Enrich requests
      const enrichedRequests: PendingRequest[] = requests.map(r => ({
        ...r,
        game: gamesMap.get(r.game_id) || { id: r.game_id, course_name: 'Unknown', start_time: null },
        requester: profilesMap.get(r.requester_user_id) || {
          id: r.requester_user_id, 
          display_name: 'Unknown', 
          profile_photo_url: null,
          home_club: null,
          eg_handicap_index: null 
        },
      }));

      return enrichedRequests;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Subscribe to realtime updates for join requests
  useEffect(() => {
    const channel = supabase
      .channel('host-pending-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_join_requests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    requests: query.data || [],
    isLoading: query.isLoading,
    count: query.data?.length || 0,
    refetch: query.refetch,
  };
}
