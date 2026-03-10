import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';

export interface Reaction {
  emoji: string;
  user_id: string;
}

export interface MessageReactions {
  [messageId: string]: Reaction[];
}

export function useMessageReactions(conversationId: string | null) {
  const { user } = useSupabaseSession();
  const [reactions, setReactions] = useState<MessageReactions>({});
  const reactionsRef = useRef<MessageReactions>({});

  // Keep ref in sync
  useEffect(() => {
    reactionsRef.current = reactions;
  }, [reactions]);

  // Fetch reactions for all messages in a conversation
  const fetchReactions = useCallback(async () => {
    if (!conversationId) return;

    // NOTE: Reactions are only loaded for the most recent 500 messages.
    // For older messages in long conversations, reactions won't display.
    // A server-side aggregation approach would fix this properly.
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (messagesError) {
      AppLog.error('[useMessageReactions]', 'Error fetching message IDs:', messagesError);
      return;
    }

    if (!messages || messages.length === 0) {
      setReactions({});
      return;
    }

    const messageIds = messages.map(m => m.id);
    const { data: reactionData, error: reactionError } = await supabase
      .from('message_reactions')
      .select('message_id, user_id, emoji')
      .in('message_id', messageIds);

    if (reactionError) {
      AppLog.error('[useMessageReactions]', 'Error fetching reactions:', reactionError);
      return;
    }

    // Group reactions by message_id
    const grouped: MessageReactions = {};
    reactionData?.forEach(r => {
      if (!grouped[r.message_id]) {
        grouped[r.message_id] = [];
      }
      grouped[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
    });

    setReactions(grouped);
  }, [conversationId]);

  // Add a reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    // Optimistically update
    setReactions(prev => {
      const newReactions = { ...prev };
      if (!newReactions[messageId]) {
        newReactions[messageId] = [];
      }
      const exists = newReactions[messageId].some(
        r => r.emoji === emoji && r.user_id === user.id
      );
      if (!exists) {
        newReactions[messageId] = [
          ...newReactions[messageId],
          { emoji, user_id: user.id }
        ];
      }
      return newReactions;
    });

    try {
      await supabase.rpc('add_message_reaction', { 
        p_message_id: messageId, 
        p_emoji: emoji 
      });
    } catch (error) {
      AppLog.error('[useMessageReactions]', 'Error adding reaction:', error);
      // Roll back optimistic update
      setReactions(prev => {
        const rolled = { ...prev };
        if (rolled[messageId]) {
          rolled[messageId] = rolled[messageId].filter(
            r => !(r.emoji === emoji && r.user_id === user.id)
          );
        }
        return rolled;
      });
    }
  }, [user]);

  // Remove a reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    // Optimistically update
    setReactions(prev => {
      const newReactions = { ...prev };
      if (newReactions[messageId]) {
        newReactions[messageId] = newReactions[messageId].filter(
          r => !(r.emoji === emoji && r.user_id === user.id)
        );
      }
      return newReactions;
    });

    try {
      await supabase.rpc('remove_message_reaction', { 
        p_message_id: messageId, 
        p_emoji: emoji 
      });
    } catch (error) {
      AppLog.error('[useMessageReactions]', 'Error removing reaction:', error);
      // Roll back optimistic update
      setReactions(prev => {
        const rolled = { ...prev };
        if (!rolled[messageId]) rolled[messageId] = [];
        const alreadyRestored = rolled[messageId].some(
          r => r.emoji === emoji && r.user_id === user.id
        );
        if (!alreadyRestored) {
          rolled[messageId] = [...rolled[messageId], { emoji, user_id: user.id }];
        }
        return rolled;
      });
    }
  }, [user]);

  // Toggle a reaction (add if not exists, remove if exists)
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const messageReactions = reactions[messageId] || [];
    const hasReacted = messageReactions.some(
      r => r.emoji === emoji && r.user_id === user.id
    );

    if (hasReacted) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  }, [user, reactions, addReaction, removeReaction]);

  // Initial fetch
  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Subscribe to realtime changes — only refetch if the reaction is for a message in this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`reactions:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const newPayload = payload.new as Record<string, unknown> | undefined;
          const oldPayload = payload.old as Record<string, unknown> | undefined;
          const messageId = (newPayload?.message_id as string) || (oldPayload?.message_id as string);
          const currentMessageIds = new Set(Object.keys(reactionsRef.current));
          if (!messageId || currentMessageIds.has(messageId)) {
            fetchReactions();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchReactions]);

  return {
    reactions,
    addReaction,
    removeReaction,
    toggleReaction,
    getReactions: (messageId: string) => reactions[messageId] || [],
  };
}
