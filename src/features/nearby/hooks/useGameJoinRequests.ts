/**
 * useGameJoinRequests - Manage game join requests
 * 
 * Uses game_participants.rsvp_status as single source of truth:
 * - 'requested' = pending request
 * - 'going' = accepted
 * - 'rejected' = declined
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';
import { emitHub } from '@/lib/hubEvents';

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
    show_handicap?: boolean;
  };
}

export function useGameJoinRequests(gameId?: string) {
  const [requests, setRequests] = useState<GameJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptedGameIds, setAcceptedGameIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch user's accepted game requests on mount (where rsvp_status = 'going')
  useEffect(() => {
    const fetchUserAcceptedRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('game_participants')
          .select('game_id')
          .eq('user_id', user.id)
          .eq('rsvp_status', 'going');

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
          table: 'game_participants',
        },
        (payload: any) => {
          if (payload.new?.rsvp_status === 'going') {
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
      .channel(`game_participants:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
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
      // Get participants with rsvp_status='requested'
      const { data: requestsData, error } = await supabase
        .from('game_participants')
        .select('id, game_id, user_id, rsvp_status, created_at')
        .eq('game_id', gameId)
        .eq('rsvp_status', 'requested')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, profile_photo_url, home_club, eg_handicap_index, show_handicap')
          .in('id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Map to legacy format for compatibility
        const enrichedRequests: GameJoinRequest[] = requestsData.map(request => ({
          id: request.id,
          game_id: request.game_id,
          requester_user_id: request.user_id,
          status: 'pending' as const,
          created_at: request.created_at,
          requester_profile: profilesMap.get(request.user_id),
        }));

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

  const createRequest = async (targetGameId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user already has a participant row
      const { data: existing } = await supabase
        .from('game_participants')
        .select('id, rsvp_status')
        .eq('game_id', targetGameId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.rsvp_status === 'requested') {
          toast({
            title: "Request already sent",
            description: "You've already requested to join this game.",
          });
          return;
        }
        if (existing.rsvp_status === 'going' || existing.rsvp_status === 'invited') {
          toast({
            title: "Already joined",
            description: "You're already in this game.",
          });
          return;
        }
        if (existing.rsvp_status === 'rejected') {
          toast({
            title: "Unable to join",
            description: "This game is no longer available to you.",
          });
          return;
        }
      }

      // Insert new participant with rsvp_status='requested'
      const { error } = await supabase
        .from('game_participants')
        .insert({
          game_id: targetGameId,
          user_id: user.id,
          role: 'player',
          rsvp_status: 'requested',
          rsvp_updated_at: new Date().toISOString(),
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

  const acceptRequest = async (requestId: string, targetGameId: string) => {
    try {
      // Update participant rsvp_status to 'going'
      const { error } = await supabase
        .from('game_participants')
        .update({ 
          rsvp_status: 'going',
          rsvp_updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Emit hub event for instant local UI update
      emitHub('game:joined', { gameId: targetGameId, requestId });

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
      // Update participant rsvp_status to 'rejected'
      const { error } = await supabase
        .from('game_participants')
        .update({ 
          rsvp_status: 'rejected',
          rsvp_updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

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
