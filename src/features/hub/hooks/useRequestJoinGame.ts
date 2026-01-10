/**
 * useRequestJoinGame - Refactored join mutation with proper mutation pattern
 * 
 * Usage: const { mutate } = useRequestJoinGame();
 *        mutate({ gameId: 'xxx' });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';

interface RequestJoinParams {
  gameId: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  GAME_NOT_AVAILABLE: "This game is no longer available.",
  ALREADY_REQUESTED: "You've already requested to join.",
  ALREADY_JOINED: "You're already in this game.",
  IS_HOST: "Cannot request to join your own game.",
  GAME_FULL: "This game is already full.",
};

export function useRequestJoinGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId }: RequestJoinParams) => {
      console.log('[useRequestJoinGame] Creating join request for game:', gameId);
      
      const { data, error } = await supabase.functions.invoke('create-join-request', {
        body: { game_id: gameId },
      });

      if (error) {
        console.error('[useRequestJoinGame] Error:', error);
        throw new Error(error.message || 'UNKNOWN_ERROR');
      }

      if (!data?.success) {
        const code = data?.error || 'UNKNOWN_ERROR';
        throw new Error(code);
      }

      return data;
    },
    onMutate: () => {
      haptic('medium');
    },
    onSuccess: (_data, { gameId }) => {
      toast.success('Request sent to host ✅');
      haptic('light');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['discover-games-v2'] });
      queryClient.invalidateQueries({ queryKey: ['game-detail', gameId] });
      queryClient.invalidateQueries({ queryKey: ['host-pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['userGames'] });
    },
    onError: (error: Error) => {
      haptic('heavy');
      const message = ERROR_MESSAGES[error.message] || 'Something went wrong. Please try again.';
      toast.error(message);
    },
  });
}
