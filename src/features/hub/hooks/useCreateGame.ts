/**
 * useCreateGame - Hook for creating games with real database inserts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GameDraft } from '../components/create-game-trip-v2/types';

interface CreateGameResult {
  gameId: string;
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: GameDraft): Promise<CreateGameResult> => {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to create a game');
      }

      // Calculate expiry (7 days from now or scheduled time + 24h)
      const expiresAt = draft.dateTime 
        ? new Date(draft.dateTime.getTime() + 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Build game record matching actual schema
      const gameRecord = {
        host_user_id: user.id,
        course_id: draft.courseId,
        visibility: draft.visibility,
        slots_total: draft.maxPlayers,
        slots_open: Math.max(0, draft.maxPlayers - 1 - draft.playerIds.length - draft.guestPlayers.length),
        note: draft.notes || null,
        start_time: draft.dateTime?.toISOString() || new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
      };

      // Insert game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert(gameRecord)
        .select('id')
        .single();

      if (gameError) {
        console.error('Failed to create game:', gameError);
        throw new Error('Failed to create game');
      }

      // Insert creator as participant with 'going' status
      const { error: creatorError } = await supabase
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: user.id,
          role: 'creator',
          state: 'accepted',
          rsvp_status: 'going',
          rsvp_updated_at: new Date().toISOString(),
          reserves_slot: true,
        });

      if (creatorError) {
        console.error('Failed to add creator as participant:', creatorError);
      }

      // Insert invited players
      if (draft.playerIds.length > 0) {
        const invites = draft.playerIds.map(playerId => ({
          game_id: game.id,
          user_id: playerId,
          role: 'player',
          state: 'invited',
          rsvp_status: 'invited' as const,
          invited_by: user.id,
          reserves_slot: false,
        }));

        const { error: inviteError } = await supabase
          .from('game_participants')
          .insert(invites);

        if (inviteError) {
          console.error('Failed to invite players:', inviteError);
        }
      }

      // Insert guest players
      if (draft.guestPlayers.length > 0) {
        const guests = draft.guestPlayers.map(guestName => ({
          game_id: game.id,
          user_id: null,
          guest_name: guestName,
          role: 'guest',
          state: 'accepted',
          rsvp_status: 'going' as const,
          added_by_user_id: user.id,
          reserves_slot: true,
        }));

        const { error: guestError } = await supabase
          .from('game_participants')
          .insert(guests);

        if (guestError) {
          console.error('Failed to add guests:', guestError);
        }
      }

      return { gameId: game.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
    },
  });
}
