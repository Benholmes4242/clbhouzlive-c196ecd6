import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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

  // Fetch reactions for all messages in a conversation
  const fetchReactions = useCallback(async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('message_reactions')
      .select(`
        id,
        message_id,
        user_id,
        emoji
      `)
      .eq('message_id', conversationId); // This won't work, need to join with messages

    // Actually fetch via messages in conversation
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId);

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
      console.error('Error fetching reactions:', reactionError);
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

    try {
      await supabase.rpc('add_message_reaction', { 
        p_message_id: messageId, 
        p_emoji: emoji 
      });

      // Optimistically update
      setReactions(prev => {
        const newReactions = { ...prev };
        if (!newReactions[messageId]) {
          newReactions[messageId] = [];
        }
        // Check if already exists
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
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [user]);

  // Remove a reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      await supabase.rpc('remove_message_reaction', { 
        p_message_id: messageId, 
        p_emoji: emoji 
      });

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
    } catch (error) {
      console.error('Error removing reaction:', error);
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

  // Subscribe to realtime changes
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
        () => {
          // Refetch on any change
          fetchReactions();
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
