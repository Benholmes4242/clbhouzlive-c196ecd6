import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';

type TargetActor = {
  actorType: 'personal' | 'business';
  actorId: string;
};

export interface UseStartConversationReturn {
  start: (target: TargetActor) => Promise<void>;
  isStarting: boolean;
}

/**
 * Shared "start a conversation" entrypoint for every Message button.
 * Uses the current acting actor (from useMessagingActor) as the sender and
 * navigates to /messages/:conversationId on success.
 */
export function useStartConversation(): UseStartConversationReturn {
  const actor = useMessagingActor();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const start = useCallback(
    async (target: TargetActor) => {
      if (!actor) return;
      if (isStarting) return;
      setIsStarting(true);
      try {
        const { data, error } = await supabase.rpc('msg_start_direct', {
          p_as_actor_type: actor.actorType,
          p_as_actor_id: actor.actorId,
          p_target_actor_type: target.actorType,
          p_target_actor_id: target.actorId,
        });
        if (error) throw error;
        const conversationId = data as unknown as string;
        if (!conversationId) {
          toast.error('Could not start conversation');
          return;
        }
        navigate(`/messages/${conversationId}`);
      } catch {
        toast.error('Could not start conversation');
      } finally {
        setIsStarting(false);
      }
    },
    [actor, isStarting, navigate],
  );

  return { start, isStarting };
}
