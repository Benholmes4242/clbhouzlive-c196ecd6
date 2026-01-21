import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { Json } from '@/integrations/supabase/types';
import type { Message, MessageWithSender, MessageType } from '@/types/messaging';

/**
 * Hook for fetching and managing messages within a specific conversation
 */
export function useConversationMessages(conversationId: string | null) {
  const { user } = useSupabaseSession();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 50;

  /**
   * Fetch messages for the conversation
   */
  const fetchMessages = useCallback(async (before?: string) => {
    if (!user || !conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messagesData, error: messagesError } = await query;

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setLoading(false);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        if (!before) setMessages([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Fetch sender profiles
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', senderIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p]) || []
      );

      // Fetch reply-to messages if any
      const replyToIds = messagesData
        .map(m => m.reply_to_id)
        .filter((id): id is string => id !== null);
      
      let replyToMap = new Map<string, Message>();
      if (replyToIds.length > 0) {
        const { data: replyToData } = await supabase
          .from('messages')
          .select('*')
          .in('id', replyToIds);

        replyToMap = new Map(
          replyToData?.map(m => [m.id, m as Message]) || []
        );
      }

      // Build messages with sender info
      const messagesWithSenders: MessageWithSender[] = messagesData.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type as MessageType,
        media_url: msg.media_url,
        media_metadata: msg.media_metadata as Record<string, unknown> | null,
        reply_to_id: msg.reply_to_id,
        is_edited: msg.is_edited ?? false,
        edited_at: msg.edited_at,
        deleted_at: msg.deleted_at,
        created_at: msg.created_at,
        sender: profilesMap.get(msg.sender_id) || null,
        reply_to: msg.reply_to_id ? replyToMap.get(msg.reply_to_id) || null : null
      }));

      // Reverse to show oldest first
      const sortedMessages = messagesWithSenders.reverse();

      if (before) {
        setMessages(prev => [...sortedMessages, ...prev]);
      } else {
        setMessages(sortedMessages);
      }

      setHasMore(messagesData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }

    setLoading(false);
  }, [user, conversationId]);

  /**
   * Load more (older) messages
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || messages.length === 0) return;
    
    const oldestMessage = messages[0];
    await fetchMessages(oldestMessage.created_at);
  }, [hasMore, loading, messages, fetchMessages]);

  /**
   * Send a message to this conversation
   */
  const sendMessage = useCallback(async (
    content: string,
    messageType: MessageType = 'text',
    mediaUrl?: string | null,
    mediaMetadata?: Record<string, unknown> | null,
    replyToId?: string | null
  ): Promise<string | null> => {
    if (!user || !conversationId) return null;

    try {
      const { data, error } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: messageType,
        p_media_url: mediaUrl || null,
        p_media_metadata: (mediaMetadata as Json) || null,
        p_reply_to_id: replyToId || null
      });

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      // Message will be added via realtime subscription
      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }, [user, conversationId]);

  /**
   * Edit a message
   */
  const editMessage = useCallback(async (
    messageId: string,
    newContent: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Can only edit own messages

      if (error) {
        console.error('Error editing message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in editMessage:', error);
      return false;
    }
  }, [user]);

  /**
   * Delete (soft delete) a message
   */
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Can only delete own messages

      if (error) {
        console.error('Error deleting message:', error);
        return false;
      }

      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      return true;
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      return false;
    }
  }, [user]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!user || !conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    // Mark conversation as read when opening
    supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conversation_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the new message with sender info
          const newMsg = payload.new as Message;
          
          const { data: senderData } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url')
            .eq('id', newMsg.sender_id)
            .single();

          const messageWithSender: MessageWithSender = {
            ...newMsg,
            message_type: newMsg.message_type as MessageType,
            media_metadata: newMsg.media_metadata as Record<string, unknown> | null,
            sender: senderData || null,
            reply_to: null // Could fetch if needed
          };

          setMessages(prev => [...prev, messageWithSender]);

          // Mark as read if we're viewing
          supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          
          setMessages(prev => prev.map(m => 
            m.id === updatedMsg.id
              ? {
                  ...m,
                  content: updatedMsg.content,
                  is_edited: updatedMsg.is_edited ?? false,
                  edited_at: updatedMsg.edited_at,
                  deleted_at: updatedMsg.deleted_at
                }
              : m
          ).filter(m => m.deleted_at === null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId, fetchMessages]);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
