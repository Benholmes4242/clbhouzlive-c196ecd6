/**
 * useHostPendingRequests - Uses game_participants.rsvp_status as single source of truth
 * 
 * Fetches all pending join requests (rsvp_status='requested') for games the current user hosts.
 * Also includes trip requests.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PendingGameRequest {
  id: string;
  game_id: string;
  user_id: string;
  rsvp_status: string;
  created_at: string;
  request_message: string | null;
  type: 'game';
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

export interface PendingTripRequest {
  id: string;
  trip_id: string;
  user_id: string;
  rsvp_status: string;
  created_at: string;
  request_message: string | null;
  type: 'trip';
  trip: {
    id: string;
    name: string;
    start_date: string | null;
  };
  requester: {
    id: string;
    display_name: string;
    profile_photo_url: string | null;
    home_club: string | null;
    eg_handicap_index: number | null;
  };
}

export type PendingRequest = PendingGameRequest | PendingTripRequest;

export function useHostPendingRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hostPendingRequests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { gameRequests: [], tripRequests: [], all: [] };

      // Get all games where user is host (include both active and scheduled)
      const { data: hostedGames, error: gamesError } = await supabase
        .from('games')
        .select('id, course_name, start_time')
        .eq('host_user_id', user.id)
        .or('status.eq.active,status.eq.scheduled');

      if (gamesError) {
        console.error('[useHostPendingRequests] Error fetching hosted games:', gamesError);
      }

      // Get all trips where user is creator
      const { data: hostedTrips, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, start_date')
        .eq('created_by', user.id)
        .eq('status', 'active');

      if (tripsError) {
        console.error('[useHostPendingRequests] Error fetching hosted trips:', tripsError);
      }

      const gameIds = (hostedGames || []).map(g => g.id);
      const tripIds = (hostedTrips || []).map(t => t.id);

      // Get pending game requests from game_participants
      let gameRequests: PendingGameRequest[] = [];
      if (gameIds.length > 0) {
        const { data: participants, error: partError } = await supabase
          .from('game_participants')
          .select('id, game_id, user_id, rsvp_status, created_at, request_message')
          .in('game_id', gameIds)
          .eq('rsvp_status', 'requested')
          .order('created_at', { ascending: false });

        if (partError) {
          console.error('[useHostPendingRequests] Error fetching game participants:', partError);
        }

        if (participants && participants.length > 0) {
          // Fetch requester profiles
          const requesterIds = [...new Set(participants.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name, profile_photo_url, home_club, eg_handicap_index')
            .in('id', requesterIds);

          const gamesMap = new Map((hostedGames || []).map(g => [g.id, g]));
          const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

          gameRequests = participants.map(p => ({
            id: p.id,
            game_id: p.game_id,
            user_id: p.user_id,
            rsvp_status: p.rsvp_status,
            created_at: p.created_at,
            request_message: p.request_message || null,
            type: 'game' as const,
            game: gamesMap.get(p.game_id) || { id: p.game_id, course_name: 'Unknown', start_time: null },
            requester: profilesMap.get(p.user_id) || {
              id: p.user_id,
              display_name: 'Unknown',
              profile_photo_url: null,
              home_club: null,
              eg_handicap_index: null
            },
          }));
        }
      }

      // Get pending trip requests from trip_participants
      let tripRequests: PendingTripRequest[] = [];
      if (tripIds.length > 0) {
        const { data: tripParticipants, error: tripPartError } = await supabase
          .from('trip_participants')
          .select('id, trip_id, user_id, rsvp_status, created_at, request_message')
          .in('trip_id', tripIds)
          .eq('rsvp_status', 'requested')
          .order('created_at', { ascending: false });

        if (tripPartError) {
          console.error('[useHostPendingRequests] Error fetching trip participants:', tripPartError);
        }

        if (tripParticipants && tripParticipants.length > 0) {
          // Fetch requester profiles
          const requesterIds = [...new Set(tripParticipants.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name, profile_photo_url, home_club, eg_handicap_index')
            .in('id', requesterIds);

          const tripsMap = new Map((hostedTrips || []).map(t => [t.id, t]));
          const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

          tripRequests = tripParticipants.map(p => ({
            id: p.id,
            trip_id: p.trip_id,
            user_id: p.user_id,
            rsvp_status: p.rsvp_status,
            created_at: p.created_at,
            request_message: p.request_message || null,
            type: 'trip' as const,
            trip: tripsMap.get(p.trip_id) || { id: p.trip_id, name: 'Unknown', start_date: null },
            requester: profilesMap.get(p.user_id) || {
              id: p.user_id,
              display_name: 'Unknown',
              profile_photo_url: null,
              home_club: null,
              eg_handicap_index: null
            },
          }));
        }
      }

      // Combine and sort by created_at
      const all: PendingRequest[] = [...gameRequests, ...tripRequests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return { gameRequests, tripRequests, all };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Subscribe to realtime updates for game_participants and trip_participants
  useEffect(() => {
    const channel = supabase
      .channel('host-pending-requests-v2')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_participants',
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
    gameRequests: query.data?.gameRequests || [],
    tripRequests: query.data?.tripRequests || [],
    requests: query.data?.all || [],
    isLoading: query.isLoading,
    gameCount: query.data?.gameRequests?.length || 0,
    tripCount: query.data?.tripRequests?.length || 0,
    count: query.data?.all?.length || 0,
    refetch: query.refetch,
  };
}
