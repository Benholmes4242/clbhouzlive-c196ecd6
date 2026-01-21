import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { Json } from '@/integrations/supabase/types';
import type {
  ConversationListItem,
  ParticipantWithProfile,
  SendMessageParams,
  ConversationType,
} from '@/types/messaging';

/**
 * Main messaging hook - handles conversations list, creating DMs/groups, and message operations
 * Uses the new schema with conversations, conversation_participants, and messages tables
 */
export function useMessaging() {
  const { user } = useSupabaseSession();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch all conversations where the current user is a participant
   */
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get all conversation IDs where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at, is_archived')
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (participantError) {
        console.error('Error fetching participant data:', participantError);
        setLoading(false);
        return;
      }

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);
      const lastReadMap = new Map(
        participantData.map(p => [p.conversation_id, p.last_read_at])
      );

      // Step 2: Fetch conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        setLoading(false);
        return;
      }

      // Step 3: Fetch all participants for these conversations with profiles
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          role,
          joined_at,
          last_read_at,
          is_muted,
          is_archived
        `)
        .in('conversation_id', conversationIds);

      if (allParticipantsError) {
        console.error('Error fetching all participants:', allParticipantsError);
        setLoading(false);
        return;
      }

      // Step 4: Fetch profiles for all participants
      const participantUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', participantUserIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p]) || []
      );

      // Step 5: Get unread counts for each conversation
      const unreadCounts = await Promise.all(
        conversationIds.map(async (convId) => {
          const { data } = await supabase.rpc('get_unread_count', {
            p_conversation_id: convId
          });
          return { convId, count: data || 0 };
        })
      );

      const unreadCountMap = new Map(
        unreadCounts.map(u => [u.convId, u.count])
      );

      // Step 6: Build conversation list items
      const conversationItems: ConversationListItem[] = (conversationsData || []).map(conv => {
        const convParticipants = (allParticipants || [])
          .filter(p => p.conversation_id === conv.id)
          .map(p => ({
            ...p,
            profile: profilesMap.get(p.user_id) || null
          })) as ParticipantWithProfile[];

        // For DMs, find the other user
        let otherUser = undefined;
        if (conv.type === 'direct') {
          const otherParticipant = convParticipants.find(p => p.user_id !== user.id);
          if (otherParticipant?.profile) {
            otherUser = otherParticipant.profile;
          }
        }

        return {
          id: conv.id,
          type: conv.type as ConversationType,
          name: conv.name,
          avatar_url: conv.avatar_url,
          last_message_preview: conv.last_message_preview,
          last_message_at: conv.last_message_at,
          unread_count: unreadCountMap.get(conv.id) || 0,
          participants: convParticipants,
          other_user: otherUser
        };
      });

      setConversations(conversationItems);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    }

    setLoading(false);
  }, [user]);

  /**
   * Get or create a DM conversation with another user
   * Uses the database function get_or_create_dm_conversation
   */
  const getOrCreateDM = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_or_create_dm_conversation', {
        other_user_id: otherUserId
      });

      if (error) {
        console.error('Error getting/creating DM:', error);
        return null;
      }

      // Refresh conversations list
      await fetchConversations();

      return data;
    } catch (error) {
      console.error('Error in getOrCreateDM:', error);
      return null;
    }
  }, [user, fetchConversations]);

  /**
   * Create a group conversation
   * Uses the database function create_group_conversation
   */
  const createGroupConversation = useCallback(async (
    groupName: string,
    participantIds: string[]
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('create_group_conversation', {
        group_name: groupName,
        participant_ids: participantIds
      });

      if (error) {
        console.error('Error creating group conversation:', error);
        return null;
      }

      // Refresh conversations list
      await fetchConversations();

      return data;
    } catch (error) {
      console.error('Error in createGroupConversation:', error);
      return null;
    }
  }, [user, fetchConversations]);

  /**
   * Send a message using the database function
   */
  const sendMessage = useCallback(async (params: SendMessageParams): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('send_message', {
        p_conversation_id: params.conversation_id,
        p_content: params.content,
        p_message_type: params.message_type || 'text',
        p_media_url: params.media_url || null,
        p_media_metadata: (params.media_metadata as Json) || null,
        p_reply_to_id: params.reply_to_id || null
      });

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }, [user]);

  /**
   * Mark a conversation as read
   */
  const markConversationRead = useCallback(async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId
      });

      if (error) {
        console.error('Error marking conversation read:', error);
        return;
      }

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error in markConversationRead:', error);
    }
  }, [user]);

  /**
   * Archive a conversation (hide from list)
   */
  const archiveConversation = useCallback(async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_archived: true })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error archiving conversation:', error);
        return;
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (error) {
      console.error('Error in archiveConversation:', error);
    }
  }, [user]);

  /**
   * Mute/unmute a conversation
   */
  const toggleMuteConversation = useCallback(async (
    conversationId: string, 
    muted: boolean
  ): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_muted: muted })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling mute:', error);
      }
    } catch (error) {
      console.error('Error in toggleMuteConversation:', error);
    }
  }, [user]);

  /**
   * Get total unread message count across all conversations
   */
  const getTotalUnreadCount = useCallback((): number => {
    return conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  }, [conversations]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();

    // Subscribe to conversation updates
    const channel = supabase
      .channel(`messaging_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refetch on any message change
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch when participant status changes
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    loading,
    fetchConversations,
    getOrCreateDM,
    createGroupConversation,
    sendMessage,
    markConversationRead,
    archiveConversation,
    toggleMuteConversation,
    getTotalUnreadCount,
  };
}
