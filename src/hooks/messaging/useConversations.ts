import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessagingActor } from './useMessagingActor';
import type { InboxConversation } from '@/types/messaging';

export function useConversations() {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  const actorType = actor?.actorType ?? null;
  const actorId = actor?.actorId ?? null;

  const query = useQuery<InboxConversation[]>({
    queryKey: ['messaging', 'inbox', actorType, actorId],
    enabled: !!actor,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_inbox' as never, {
        p_actor_type: actorType,
        p_actor_id: actorId,
      } as never);
      if (error) throw error;
      return ((data ?? []) as unknown) as InboxConversation[];
    },
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!actorType || !actorId) return;

    const key = ['messaging', 'inbox', actorType, actorId];
    const scheduleInvalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: key });
      }, 300);
    };

    const channel = supabase
      .channel(`inbox:${actorType}:${actorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        scheduleInvalidate,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members' },
        scheduleInvalidate,
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [actorType, actorId, queryClient]);

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
