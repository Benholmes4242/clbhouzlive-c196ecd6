import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MESSAGE, PROFILE_MINIMAL } from '@/lib/supabase/selects';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  friend_id: string;
  friend_name: string;
  friend_username: string;
  friend_photo_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_last_message_from_me: boolean;
}

export function useMessages() {
  const { user } = useSupabaseSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Get all messages for the current user
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, read, created_at, updated_at')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setLoading(false);
        return;
      }

      // Group messages by conversation (friend)
      const conversationMap = new Map<string, Conversation>();

      for (const message of messages || []) {
        const friendId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        
        if (!conversationMap.has(friendId)) {
          // Get friend's profile with minimal select
          const { data: friendProfile } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url')
            .eq('id', friendId)
            .single();

          conversationMap.set(friendId, {
            friend_id: friendId,
            friend_name: friendProfile?.display_name || '',
            friend_username: friendProfile?.username || '',
            friend_photo_url: friendProfile?.profile_photo_url || null,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
            is_last_message_from_me: message.sender_id === user.id
          });
        }

        // Count unread messages from this friend
        if (message.recipient_id === user.id && !message.read) {
          const conv = conversationMap.get(friendId)!;
          conv.unread_count++;
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();
    
    // Set up real-time subscription for new messages
    const channelName = `messages_${user.id}`;
    
    import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
      const channel = channelManager.createChannel(channelName);
      
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();
    });

    return () => {
      import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
        channelManager.removeChannel(channelName);
      });
    };
  }, [user, fetchConversations]);

  // Check if this is the first message in a conversation
  const isFirstMessageInConversation = async (recipientId: string): Promise<boolean> => {
    if (!user) return true;
    
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`);
    
    return (count ?? 0) === 0;
  };

  const sendMessage = async (recipientId: string, content: string) => {
    if (!user) return null;

    // Check if this is the first message (for notification)
    const isFirstMessage = await isFirstMessageInConversation(recipientId);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim()
      })
      .select()
      .single();

    if (!error && data) {
      // Only notify on first message in a new thread
      if (isFirstMessage) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          actor_id: user.id,
          type: 'message',
          title: 'New message',
          message: 'sent you a message',
          entity_type: 'message',
          entity_id: data.id,
          data: { 
            message_id: data.id, 
            sender_id: user.id,
            message_preview: content.trim().slice(0, 100),
          },
        });
      }

      fetchConversations();
    }

    return { data, error };
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', user.id)
      .eq('read', false);

    if (!error) {
      fetchConversations();
    }
  };

  return {
    conversations,
    loading,
    sendMessage,
    markMessagesAsRead,
    refetch: fetchConversations
  };
}
