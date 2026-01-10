/**
 * useRequestJoinGame - Refactored join mutation with proper mutation pattern
 * 
 * Uses predicate-based invalidation for all discover-games query variants
 * Now supports optional message field for Phase 2
 * 
 * Usage: const { mutate } = useRequestJoinGame();
 *        mutate({ gameId: 'xxx', message: 'optional note' });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';

interface RequestJoinParams {
  gameId: string;
  message?: string | null;
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
    mutationFn: async ({ gameId, message }: RequestJoinParams) => {
      console.log('[useRequestJoinGame] Creating join request for game:', gameId, message ? '(with message)' : '');
      
      const { data, error } = await supabase.functions.invoke('create-join-request', {
        body: { game_id: gameId, message: message || null },
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
      
      // Predicate-based invalidation: catch all discover-games variants
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'discover-games' || key === 'discover-games-v2';
        },
      });
      
      // Also invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['game-detail', gameId] });
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
    },
    onError: (error: Error) => {
      haptic('heavy');
      const message = ERROR_MESSAGES[error.message] || 'Something went wrong. Please try again.';
      toast.error(message);
    },
  });
}
