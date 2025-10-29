import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface GameJoinRequest {
  id: string;
  game_id: string;
  requester_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester_profile?: {
    display_name: string;
    profile_photo_url: string | null;
    home_club: string | null;
    eg_handicap_index: number | null;
  };
}

export function useGameJoinRequests(gameId?: string) {
  const [requests, setRequests] = useState<GameJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!gameId) {
      setIsLoading(false);
      setRequests([]);
      return;
    }

    fetchRequests();
    
    // Subscribe to realtime updates
    const channel: RealtimeChannel = supabase
      .channel(`game_join_requests:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_join_requests',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [gameId]);

  const fetchRequests = async () => {
    if (!gameId) return;

    try {
      const { data: requestsData, error } = await supabase
        .from('game_join_requests')
        .select('*')
        .eq('game_id', gameId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(r => r.requester_user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, profile_photo_url, home_club, eg_handicap_index')
          .in('id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const enrichedRequests = requestsData.map(request => ({
          ...request,
          requester_profile: profilesMap.get(request.requester_user_id),
        })) as GameJoinRequest[];

        setRequests(enrichedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async (gameId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Check if user already has a pending request
      const { data: existing } = await supabase
        .from('game_join_requests')
        .select('id, status')
        .eq('game_id', gameId)
        .eq('requester_user_id', user.user.id)
        .single();

      if (existing) {
        if (existing.status === 'pending') {
          toast({
            title: "Request already sent",
            description: "You've already requested to join this game.",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('game_join_requests')
        .insert({
          game_id: gameId,
          requester_user_id: user.user.id,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "You'll get a response from the group host.",
      });
    } catch (error) {
      console.error('Error creating join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const acceptRequest = async (requestId: string, gameId: string) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('game_join_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Decrement players_needed
      const { data: game } = await supabase
        .from('game_beacons')
        .select('players_needed')
        .eq('id', gameId)
        .single();

      if (game && game.players_needed && game.players_needed > 0) {
        await supabase
          .from('game_beacons')
          .update({ players_needed: game.players_needed - 1 })
          .eq('id', gameId);
      }

      // Get requester info for notification
      const { data: request } = await supabase
        .from('game_join_requests')
        .select('requester_user_id')
        .eq('id', requestId)
        .single();

      if (request) {
        // Send notification to requester
        const { data: gameData } = await supabase
          .from('game_beacons')
          .select('course_name, tee_time')
          .eq('id', gameId)
          .single();

        await supabase.rpc('send_push_notification', {
          target_user_id: request.requester_user_id,
          notification_type: 'game_accepted',
          title: "You're in 👋",
          message: `You've been added to the game at ${gameData?.course_name || 'the course'}`,
          data: { game_id: gameId },
        });
      }

      toast({
        title: "Request accepted",
        description: "Player added to your game.",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('game_join_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Get requester info for notification
      const { data: request } = await supabase
        .from('game_join_requests')
        .select('requester_user_id')
        .eq('id', requestId)
        .single();

      if (request) {
        await supabase.rpc('send_push_notification', {
          target_user_id: request.requester_user_id,
          notification_type: 'game_declined',
          title: "Game update",
          message: "This spot is now full.",
          data: {},
        });
      }

      toast({
        title: "Request declined",
        description: "Player has been notified.",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    requests,
    isLoading,
    createRequest,
    acceptRequest,
    declineRequest,
  };
}
