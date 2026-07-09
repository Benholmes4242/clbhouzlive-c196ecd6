import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessagingActor } from './useMessagingActor';
import {
  dedupeByClientId,
  insertOptimistic as cacheInsertOptimistic,
  resolveOptimistic as cacheResolveOptimistic,
  markFailed as cacheMarkFailed,
  removeOptimistic as cacheRemoveOptimistic,
} from './threadCache';
import type { ThreadMessage, MessageReaction } from '@/types/messaging';

const PAGE_SIZE = 30;

export function useThread(conversationId: string | null) {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  const queryKey = ['messaging', 'thread', conversationId] as const;

  const query = useInfiniteQuery<ThreadMessage[], Error>({
    queryKey,
    enabled: !!conversationId && !!actor,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_thread', {
        p_conversation_id: conversationId as string,
        p_before: (pageParam as string | null) ?? null,
        p_limit: PAGE_SIZE,
      });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ThreadMessage[];
      return rows.map((r) => ({
        ...r,
        reactions: Array.isArray(r.reactions)
          ? (r.reactions as MessageReaction[])
          : [],
      }));
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
  });

  // Pages are newest-first per page; flatten then reverse for oldest->newest.
  const messages = useMemo<ThreadMessage[]>(() => {
    const pages = query.data?.pages ?? [];
    // Concatenate newest-first across pages, then reverse.
    const flat: ThreadMessage[] = [];
    for (const p of pages) flat.push(...p);
    return flat.slice().reverse();
  }, [query.data]);

  // Realtime channel
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!conversationId) return;

    const scheduleInvalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['messaging', 'thread', conversationId],
        });
      }, 200);
    };

    const channel = supabase
      .channel(`thread:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        scheduleInvalidate,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
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
  }, [conversationId, queryClient]);

  // Mark read on newest message
  const newestId = messages.length ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (!conversationId || !actor || !newestId) return;
    supabase
      .rpc('msg_mark_read', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_up_to_message_id: newestId,
      })
      .then(() => undefined, () => undefined);
  }, [conversationId, actor, newestId]);

  return {
    messages,
    fetchOlder: query.fetchNextPage,
    hasOlder: query.hasNextPage,
    isLoading: query.isLoading,
    isFetchingOlder: query.isFetchingNextPage,
    error: query.error,
  };
}
