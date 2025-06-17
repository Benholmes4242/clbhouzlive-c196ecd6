
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages-changes')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Get all conversations with last message and unread count
    const { data: conversationsData, error } = await supabase.rpc('get_conversations', {
      user_id: user.id
    });

    if (!error && conversationsData) {
      setConversations(conversationsData);
    }
    setLoading(false);
  };

  const sendMessage = async (recipientId: string, content: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim()
      })
      .select()
      .single();

    if (!error) {
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
