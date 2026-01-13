/**
 * useDeleteGame - Hook for cancelling/deleting games
 * Uses soft delete by setting status to 'cancelled'
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (error) throw error;
      return gameId;
    },
    onSuccess: (gameId) => {
      queryClient.invalidateQueries({ queryKey: ['my-hub-events'] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game-detail', gameId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
    },
  });
}
