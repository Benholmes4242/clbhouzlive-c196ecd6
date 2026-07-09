import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessagingActor } from './useMessagingActor';

interface ReactionVars {
  messageId: string;
  emoji: string;
  conversationId: string;
}

export function useAddReaction() {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: ReactionVars) => {
      if (!actor) throw new Error('No active actor');
      const { error } = await supabase.rpc('msg_react', {
        p_message_id: messageId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_emoji: emoji,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['messaging', 'thread', vars.conversationId],
      });
    },
  });
}

export function useRemoveReaction() {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: ReactionVars) => {
      if (!actor) throw new Error('No active actor');
      const { error } = await supabase.rpc('msg_unreact', {
        p_message_id: messageId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_emoji: emoji,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['messaging', 'thread', vars.conversationId],
      });
    },
  });
}
