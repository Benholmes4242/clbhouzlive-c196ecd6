/**
 * useArchivePastGame - Hook for archiving past games from user's list
 * Uses archived_at column on game_participants to hide games per-user
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useArchivePastGame() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (gameId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user is participant
      const { data: participant } = await supabase
        .from('game_participants')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (participant) {
        // Update existing participant row with archived_at
        const { error } = await supabase
          .from('game_participants')
          .update({ archived_at: new Date().toISOString() })
          .eq('game_id', gameId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // User is host but not in participants - insert with archived_at
        const { error } = await supabase
          .from('game_participants')
          .insert({
            game_id: gameId,
            user_id: user.id,
            rsvp_status: 'going',
            archived_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return gameId;
    },
    onMutate: async (gameId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-games', 'past'] });

      // Snapshot the previous value
      const previousGames = queryClient.getQueryData(['user-games', 'past']);

      // Optimistically remove from the list
      queryClient.setQueryData(['user-games', 'past'], (old: any[]) => 
        old?.filter(game => game.id !== gameId) ?? []
      );

      return { previousGames };
    },
    onError: (err, gameId, context) => {
      // Roll back on error
      if (context?.previousGames) {
        queryClient.setQueryData(['user-games', 'past'], context.previousGames);
      }
      toast.error('Failed to remove game from list');
      console.error('Archive game error:', err);
    },
    onSuccess: () => {
      toast.success('Game removed from your list');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user-games', 'past'] });
    },
  });

  return {
    archiveGame: mutation.mutate,
    isPending: mutation.isPending,
  };
}
