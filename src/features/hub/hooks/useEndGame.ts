/**
 * useEndGame - Hook for ending a game
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEndGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      const { error } = await supabase
        .from('games')
        .update({
          status: 'completed',
          ends_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (error) throw error;

      // Disable reminders for all participants
      await supabase
        .from('game_reminders')
        .update({ enabled: false })
        .eq('game_id', gameId);
    },
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
    },
  });
}
