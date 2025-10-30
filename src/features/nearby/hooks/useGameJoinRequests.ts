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
  const [acceptedGameIds, setAcceptedGameIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch user's accepted game requests on mount
  useEffect(() => {
    const fetchUserAcceptedRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('game_join_requests')
          .select('game_id')
          .eq('requester_user_id', user.id)
          .eq('status', 'accepted');

        if (data) {
          setAcceptedGameIds(new Set(data.map(r => r.game_id)));
        }
      } catch (error) {
        console.error('Error fetching accepted requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAcceptedRequests();
  }, []);

  // Realtime listener for instant "You're in 👋" updates
  useEffect(() => {
    const channel = supabase
      .channel('user-game-joins')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_join_requests',
        },
        (payload: any) => {
          if (payload.new?.status === 'accepted') {
            setAcceptedGameIds(prev => {
              const next = new Set(prev);
              next.add(payload.new.game_id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user already has a pending request
      const { data: existing } = await supabase
        .from('game_join_requests')
        .select('id, status')
        .eq('game_id', gameId)
        .eq('requester_user_id', user.id)
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
          requester_user_id: user.id,
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
      const { error } = await supabase.rpc('game_request_decide', {
        p_request_id: requestId,
        p_decision: 'accept',
      });

      if (error) throw error;

      toast({
        title: "They're in 👍",
        description: "We've notified them they're added to your game.",
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
      const { error } = await supabase.rpc('game_request_decide', {
        p_request_id: requestId,
        p_decision: 'decline',
      });

      if (error) throw error;

      toast({
        title: "We've let them know the round is full",
        description: "Request declined.",
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
    acceptedGameIds,
  };
}
