/**
 * useGameRsvp - Hook for managing RSVP status for a game
 * 
 * Returns current user's RSVP, participant counts, and setRsvp action
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  useSendRsvpNotification, 
  formatGameDateForNotification 
} from './useGameNotifications';

export type RsvpStatus = 'going' | 'maybe' | 'declined' | 'invited';

export interface RsvpCounts {
  going: number;
  maybe: number;
  declined: number;
  invited: number;
}

export interface GameRsvpData {
  gameId: string;
  currentUserRsvp: RsvpStatus | null;
  isHost: boolean;
  counts: RsvpCounts;
  participants: {
    id: string;
    userId: string | null;
    guestName: string | null;
    rsvpStatus: RsvpStatus;
    displayName?: string;
    avatarUrl?: string;
  }[];
  _gameData?: {
    hostUserId: string;
    courseName: string | null;
    startTime: string;
  };
}

export function useGameRsvp(gameId: string | undefined) {
  const queryClient = useQueryClient();
  const sendRsvpNotification = useSendRsvpNotification();

  const query = useQuery({
    queryKey: ['game-rsvp', gameId],
    queryFn: async (): Promise<GameRsvpData | null> => {
      if (!gameId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get game to check if user is host
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('host_user_id, course_name, start_time')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      const isHost = game.host_user_id === user.id;

      // Get all participants with profiles
      const { data: participants, error: partError } = await supabase
        .from('game_participants')
        .select(`
          id,
          user_id,
          guest_name,
          rsvp_status,
          user_profiles:user_id (
            display_name,
            profile_photo_url
          )
        `)
        .eq('game_id', gameId);

      if (partError) throw partError;

      // Calculate counts
      const counts: RsvpCounts = {
        going: isHost ? 1 : 0, // Host is always going
        maybe: 0,
        declined: 0,
        invited: 0,
      };

      let currentUserRsvp: RsvpStatus | null = isHost ? 'going' : null;

      const mappedParticipants = (participants || []).map(p => {
        const status = (p.rsvp_status as RsvpStatus) || 'invited';
        counts[status] = (counts[status] || 0) + 1;

        if (p.user_id === user.id) {
          currentUserRsvp = status;
        }

        const profile = p.user_profiles as any;
        return {
          id: p.id,
          userId: p.user_id,
          guestName: p.guest_name,
          rsvpStatus: status,
          displayName: profile?.display_name || p.guest_name || 'Guest',
          avatarUrl: profile?.profile_photo_url,
        };
      });

      return {
        gameId,
        currentUserRsvp,
        isHost,
        counts,
        participants: mappedParticipants,
        // Store game data for notifications
        _gameData: {
          hostUserId: game.host_user_id,
          courseName: game.course_name,
          startTime: game.start_time,
        },
      };
    },
    enabled: !!gameId,
    staleTime: 30000,
  });

  const setRsvpMutation = useMutation({
    mutationFn: async (newStatus: RsvpStatus) => {
      if (!gameId) throw new Error('No game ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's display name for notifications
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      // Upsert participant with new RSVP status
      const { error } = await supabase
        .from('game_participants')
        .upsert(
          {
            game_id: gameId,
            user_id: user.id,
            rsvp_status: newStatus,
            rsvp_updated_at: new Date().toISOString(),
            role: 'player',
            state: newStatus === 'going' ? 'accepted' : 'invited', // Keep state in sync
            reserves_slot: newStatus === 'going',
          },
          {
            onConflict: 'game_id,user_id',
          }
        );

      if (error) throw error;
      return { newStatus, playerName: userProfile?.display_name || 'Someone' };
    },
    onSuccess: ({ newStatus, playerName }) => {
      // Invalidate game detail data
      queryClient.invalidateQueries({ queryKey: ['game-rsvp', gameId] });
      
      // Invalidate user's games lists
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      
      // Invalidate all discover games queries (any filter combination)
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'discover-games',
      });
      
      const messages: Record<RsvpStatus, string> = {
        going: "You're going! 🏌️",
        maybe: "Marked as maybe",
        declined: "You've declined",
        invited: "RSVP cleared",
      };
      toast.success(messages[newStatus]);

      // Send RSVP notification for "going" status
      if (newStatus === 'going' && query.data?._gameData) {
        const gameData = query.data._gameData;
        
        // Recipients: host always + capped going participants (max 10 to prevent noise)
        const MAX_GOING_RECIPIENTS = 10;
        const goingParticipants = query.data.participants
          .filter(p => p.userId && p.rsvpStatus === 'going')
          .slice(0, MAX_GOING_RECIPIENTS)
          .map(p => p.userId!);
        
        const recipientUserIds = [
          gameData.hostUserId,
          ...goingParticipants,
        ].filter((id, idx, arr) => arr.indexOf(id) === idx); // Dedupe

        sendRsvpNotification.mutate({
          gameId: gameId!,
          newStatus,
          playerName,
          courseName: gameData.courseName || 'Golf Game',
          date: formatGameDateForNotification(gameData.startTime),
          recipientUserIds,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update RSVP:', error);
      toast.error('Failed to update RSVP');
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    setRsvp: setRsvpMutation.mutate,
    isUpdating: setRsvpMutation.isPending,
  };
}

/**
 * useInviteToGame - Hook for inviting users to a game
 */
export function useInviteToGame(gameId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      if (!gameId) throw new Error('No game ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert participants with invited status
      const participants = userIds.map(userId => ({
        game_id: gameId,
        user_id: userId,
        rsvp_status: 'invited' as const,
        invited_by: user.id,
        role: 'player' as const,
        state: 'invited' as const,
        reserves_slot: false,
      }));

      const { error } = await supabase
        .from('game_participants')
        .upsert(participants, { onConflict: 'game_id,user_id' });

      if (error) throw error;
      return userIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['game-rsvp', gameId] });
      toast.success(`Invited ${count} golfer${count !== 1 ? 's' : ''}`);
    },
    onError: (error) => {
      console.error('Failed to invite:', error);
      toast.error('Failed to send invites');
    },
  });
}
