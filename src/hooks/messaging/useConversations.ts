import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessagingActor } from './useMessagingActor';
import { registerMessagingChannel } from './messagingResumeRegistry';
import type { InboxConversation } from '@/types/messaging';
import type { RealtimeChannel } from '@supabase/supabase-js';


export function useConversations() {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  const actorType = actor?.actorType ?? null;
  const actorId = actor?.actorId ?? null;

  const query = useQuery<InboxConversation[]>({
    queryKey: ['messaging', 'inbox', actorType, actorId],
    enabled: !!actor,
    // Per-query override: the Messages tab must reflect reality on open.
    // 10s staleTime dampens rapid tab flips without starving the list; the
    // global refetchOnMount: true then refetches once that window lapses.
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!actorType || !actorId) return [];
      const { data, error } = await supabase.rpc('get_inbox', {
        p_actor_type: actorType,
        p_actor_id: actorId,
      });
      if (error) throw error;
      const rows = (data ?? []) as unknown as InboxConversation[];
      return rows.map((r) => ({
        ...r,
        participants: Array.isArray(r.participants) ? r.participants : [],
      }));
    },
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribeTickRef = useRef(0);
  const buildAndSubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!actorType || !actorId) return;

    const key = ['messaging', 'inbox', actorType, actorId] as const;
    const scheduleInvalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: key });
      }, 300);
    };

    const buildAndSubscribe = () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* noop */ }
        channelRef.current = null;
      }
      subscribeTickRef.current += 1;
      const channel = supabase
        .channel(`inbox:${actorType}:${actorId}:${subscribeTickRef.current}`)
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
      channelRef.current = channel;
    };
    buildAndSubscribeRef.current = buildAndSubscribe;
    buildAndSubscribe();

    const unregister = registerMessagingChannel({
      getChannel: () => channelRef.current,
      resubscribe: () => {
        buildAndSubscribeRef.current?.();
      },
    });

    return () => {
      unregister();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* noop */ }
        channelRef.current = null;
      }
      buildAndSubscribeRef.current = null;
    };
  }, [actorType, actorId, queryClient]);

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasActor: !!actor,
  };
}
