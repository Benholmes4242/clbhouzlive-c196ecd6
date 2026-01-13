/**
 * useCancelGame - Hook for cancelling a game
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CancelGameParams {
  gameId: string;
  reason?: string;
}

export function useCancelGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, reason }: CancelGameParams) => {
      // Update game status to cancelled
      // The DB trigger will notify all participants
      const updateData: Record<string, unknown> = {
        status: 'canceled',
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.note = `Cancelled: ${reason}`;
      }

      const { data, error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
      queryClient.invalidateQueries({ queryKey: ['game-detail', variables.gameId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
      queryClient.invalidateQueries({ queryKey: ['discover-games'] });
      toast.success('Game cancelled', {
        description: 'All participants have been notified',
      });
    },
    onError: (error) => {
      toast.error('Failed to cancel game', {
        description: error.message,
      });
    },
  });
}
