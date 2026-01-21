/**
 * @deprecated This hook uses legacy message schema. Use useMessaging instead for new implementations.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  conversation_id?: string;
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

/**
 * @deprecated Use useMessaging hook for new messaging implementations
 */
export function useMessages() {
  const { user } = useSupabaseSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Get conversations where user is a participant
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (!participantData?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convIds = participantData
        .map(p => p.conversation_id)
        .filter((id): id is string => !!id);

      // Get conversation details
      const { data: convData } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          last_message_preview,
          last_message_at,
          conversation_participants!inner(user_id)
        `)
        .in('id', convIds)
        .eq('type', 'direct');

      if (!convData?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Build conversation list
      const conversationList: Conversation[] = [];
      
      for (const conv of convData) {
        const otherParticipant = (conv.conversation_participants as any[])?.find(
          (p: any) => p.user_id !== user.id
        );
        
        if (!otherParticipant) continue;
        
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('id, username, display_name, profile_photo_url')
          .eq('id', otherParticipant.user_id)
          .single();

        if (profile) {
          conversationList.push({
            friend_id: profile.id || '',
            friend_name: profile.display_name || '',
            friend_username: profile.username || '',
            friend_photo_url: profile.profile_photo_url,
            last_message: conv.last_message_preview || '',
            last_message_time: conv.last_message_at || '',
            unread_count: 0,
            is_last_message_from_me: false
          });
        }
      }

      setConversations(conversationList);
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
  }, [user, fetchConversations]);

  const sendMessage = async (recipientId: string, content: string) => {
    if (!user) return null;

    // Use RPC to get/create DM and send message
    const { data: convId } = await supabase.rpc('get_or_create_dm_conversation', {
      other_user_id: recipientId,
    });

    if (!convId) return { data: null, error: new Error('Failed to get conversation') };

    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: convId,
      p_content: content.trim(),
      p_message_type: 'text'
    });

    if (!error) {
      fetchConversations();
    }

    return { data, error };
  };

  const markMessagesAsRead = async (senderId: string) => {
    // This is now handled via mark_conversation_read RPC
    console.log('[useMessages] markMessagesAsRead is deprecated, use markAsRead from useMessaging');
  };

  return {
    conversations,
    loading,
    sendMessage,
    markMessagesAsRead,
    refetch: fetchConversations
  };
}
