import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';

export type JoinGameState = 'idle' | 'pending' | 'requested' | 'error';
export type ErrorCode = 'GAME_NOT_AVAILABLE' | 'ALREADY_REQUESTED' | 'ALREADY_JOINED' | 'IS_HOST' | string;

const ERROR_MESSAGES: Record<string, string> = {
  GAME_NOT_AVAILABLE: "This game is no longer available.",
  ALREADY_REQUESTED: "You've already requested this game.",
  ALREADY_JOINED: "You're already in this game.",
  IS_HOST: "Cannot request to join your own game.",
};

export function useJoinGame(gameId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<JoinGameState>('idle');
  const [errorCode, setErrorCode] = useState<ErrorCode | undefined>();

  const mutation = useMutation({
    mutationFn: async () => {
      console.log('[useJoinGame] Creating join request for game:', gameId);
      setState('pending');
      
      const { data, error } = await supabase.functions.invoke('create-join-request', {
        body: { game_id: gameId },
      });

      if (error) {
        console.error('[useJoinGame] Error:', error);
        const errorData = typeof error === 'object' && 'error' in error 
          ? error as { error: string; message: string }
          : { error: 'UNKNOWN_ERROR', message: error.message || 'Unknown error' };
        
        setErrorCode(errorData.error);
        throw new Error(errorData.error);
      }

      if (!data || !data.success) {
        const errorData = data as { error?: string; message?: string };
        const code = errorData?.error || 'UNKNOWN_ERROR';
        setErrorCode(code);
        throw new Error(code);
      }

      setState('requested');
      return data;
    },
    onMutate: async () => {
      haptic('medium');
      await queryClient.cancelQueries({ queryKey: ['games'] });
    },
    onSuccess: () => {
      toast.success('Request sent to host ✅');
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['gameJoinRequests'] });
      queryClient.invalidateQueries({ queryKey: ['userGames'] });
    },
    onError: (error: Error) => {
      haptic('heavy');
      setState('error');
      const message = ERROR_MESSAGES[error.message] || 'Something went wrong. Please try again.';
      toast.error(message);
    },
  });

  return {
    requestJoin: mutation.mutate,
    isPending: mutation.isPending,
    state,
    errorCode,
  };
}
