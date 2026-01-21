import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { Message as NewMessage } from '@/types/messaging';

// Legacy Message interface for backward compatibility
export interface LegacyMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  conversation_id?: string;
  message_type?: string;
}

/**
 * Hook for fetching messages in a conversation between current user and a friend.
 * Uses the new conversation-based messaging schema.
 */
export function useConversation(friendId: string | null) {
  const { user } = useSupabaseSession();
  const [messages, setMessages] = useState<LegacyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // First, find or create a DM conversation with this friend
  const findOrCreateConversation = useCallback(async () => {
    if (!user || !friendId) return null;
    
    try {
      const { data, error } = await supabase.rpc('get_or_create_dm_conversation', {
        other_user_id: friendId,
      });
      
      if (error) {
        console.error('[useConversation] Error getting/creating DM:', error);
        return null;
      }
      
      return data as string;
    } catch (err) {
      console.error('[useConversation] Error:', err);
      return null;
    }
  }, [user, friendId]);

  const fetchMessages = useCallback(async () => {
    if (!user || !friendId || !conversationId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, conversation_id, message_type')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data.map(m => ({
        id: m.id,
        sender_id: m.sender_id || '',
        content: m.content || '',
        created_at: m.created_at,
        conversation_id: m.conversation_id || undefined,
        message_type: m.message_type || 'text',
      })));
    }
    setLoading(false);
  }, [user, friendId, conversationId]);

  // Initialize conversation
  useEffect(() => {
    if (!user || !friendId) {
      setMessages([]);
      setConversationId(null);
      setLoading(false);
      return;
    }

    findOrCreateConversation().then(id => {
      setConversationId(id);
    });
  }, [user, friendId, findOrCreateConversation]);

  // Fetch messages when conversation is ready
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();
    
    // Set up real-time subscription for this conversation
    const channelName = `conversation_messages_${conversationId}`;
    
    import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
      const channel = channelManager.createChannel(channelName);
      
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();
    });

    return () => {
      import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
        channelManager.removeChannel(channelName);
      });
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    conversationId,
    refetch: fetchMessages
  };
}