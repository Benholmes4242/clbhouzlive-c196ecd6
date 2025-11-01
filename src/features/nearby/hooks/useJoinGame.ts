import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';

export function useJoinGame(gameId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already requested
      const { data: existing } = await supabase
        .from('game_join_requests')
        .select('id, status')
        .eq('game_id', gameId)
        .eq('requester_user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('Request already pending');
        }
        if (existing.status === 'accepted') {
          throw new Error('Already joined this game');
        }
      }

      // Create join request
      const { error } = await supabase
        .from('game_join_requests')
        .insert({
          game_id: gameId,
          requester_user_id: user.id,
          status: 'pending',
        });

      if (error) throw error;
    },
    onMutate: async () => {
      haptic('medium');
      await queryClient.cancelQueries({ queryKey: ['games'] });
    },
    onSuccess: () => {
      toast.success('Join request sent');
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['gameJoinRequests'] });
    },
    onError: (error: Error) => {
      haptic('heavy');
      toast.error(error.message || 'Failed to send request');
    },
  });

  return {
    requestJoin: mutation.mutate,
    isPending: mutation.isPending,
  };
}
