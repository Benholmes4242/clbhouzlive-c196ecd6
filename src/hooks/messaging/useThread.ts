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
import { registerMessagingChannel } from './messagingResumeRegistry';
import type { ThreadMessage, MessageReaction, InboxConversation } from '@/types/messaging';
import type { RealtimeChannel } from '@supabase/supabase-js';

const PAGE_SIZE = 30;

export function useThread(conversationId: string | null) {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  const queryKey = ['messaging', 'thread', conversationId] as const;

  const query = useInfiniteQuery<ThreadMessage[], Error>({
    queryKey,
    enabled: !!conversationId && !!actor,
    initialPageParam: null as string | null,
    // Per-query overrides: opening a thread must always show current messages,
    // so drop the global 5m staleTime. refetchOnMount now comes from the global
    // default (true), which refetches this permanently-stale query on mount.
    staleTime: 0,
    refetchOnWindowFocus: true,
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
  // Dedupe by client_id so an optimistic bubble and its server twin never coexist.
  const messages = useMemo<ThreadMessage[]>(() => {
    const pages = query.data?.pages ?? [];
    const flat: ThreadMessage[] = [];
    for (const p of pages) flat.push(...p);
    const chronological = flat.slice().reverse();
    return dedupeByClientId(chronological);
  }, [query.data]);

  // Realtime channel
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribeTickRef = useRef(0);
  const buildAndSubscribeRef = useRef<(() => void) | null>(null);

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

    const buildAndSubscribe = () => {
      // Tear down previous channel if any.
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* noop */ }
        channelRef.current = null;
      }
      subscribeTickRef.current += 1;
      const name = `thread:${conversationId}:${subscribeTickRef.current}`;
      const channel = supabase
        .channel(name)
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
      channelRef.current = channel;
    };
    buildAndSubscribeRef.current = buildAndSubscribe;
    buildAndSubscribe();

    // FIX 2: expose channel + resubscribe callback to the messaging resume hook.
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
  }, [conversationId, queryClient]);

  // Mark read on newest message
  const newestId = messages.length ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (!conversationId || !actor || !newestId) return;
    const actorType = actor.actorType;
    const actorId = actor.actorId;
    supabase
      .rpc('msg_mark_read', {
        p_conversation_id: conversationId,
        p_as_actor_type: actorType,
        p_as_actor_id: actorId,
        p_up_to_message_id: newestId,
      })
      .then(({ error }) => {
        if (error) return;

        // FIX 3.1: Optimistic row clear on the inbox cache — set unread_count
        // to 0 for the conversation just read so per-row badges drop instantly.
        const inboxKey = ['messaging', 'inbox', actorType, actorId] as const;
        queryClient.setQueryData<InboxConversation[] | undefined>(
          inboxKey,
          (prev) => {
            if (!Array.isArray(prev)) return prev;
            let changed = false;
            const next = prev.map((row) => {
              if (row.conversation_id === conversationId && (row.unread_count ?? 0) !== 0) {
                changed = true;
                return { ...row, unread_count: 0 };
              }
              return row;
            });
            return changed ? next : prev;
          },
        );

        // FIX 3.2: Invalidate inbox (prefix) for consistency across actors.
        queryClient.invalidateQueries({
          queryKey: ['messaging', 'inbox'],
          refetchType: 'active',
        });

        // FIX 3.3: Force refetch of actor-unread-counts even if inactive
        // (badge query may be inactive while on a thread route).
        queryClient.invalidateQueries({
          queryKey: ['actor-unread-counts'],
          refetchType: 'all',
        });
      });
  }, [conversationId, actor, newestId, queryClient]);

  // Cache mutators bound to this conversationId (convenience for consumers).
  const insertOptimistic = useCallback(
    (msg: ThreadMessage) => {
      if (!conversationId) return;
      cacheInsertOptimistic(queryClient, conversationId, msg);
    },
    [conversationId, queryClient],
  );
  const resolveOptimistic = useCallback(
    (clientId: string, serverRow: Partial<ThreadMessage>) => {
      if (!conversationId) return;
      cacheResolveOptimistic(queryClient, conversationId, clientId, serverRow);
    },
    [conversationId, queryClient],
  );
  const markFailed = useCallback(
    (clientId: string) => {
      if (!conversationId) return;
      cacheMarkFailed(queryClient, conversationId, clientId);
    },
    [conversationId, queryClient],
  );
  const removeOptimistic = useCallback(
    (clientId: string) => {
      if (!conversationId) return;
      cacheRemoveOptimistic(queryClient, conversationId, clientId);
    },
    [conversationId, queryClient],
  );

  return {
    messages,
    fetchOlder: query.fetchNextPage,
    hasOlder: query.hasNextPage,
    isLoading: query.isLoading,
    isFetchingOlder: query.isFetchingNextPage,
    error: query.error,
    refetch: query.refetch,
    insertOptimistic,
    resolveOptimistic,
    markFailed,
    removeOptimistic,
  };
}
