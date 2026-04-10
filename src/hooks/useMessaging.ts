import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { AppLog } from '@/lib/logger';
import type { 
  ConversationWithDetails, 
  ParticipantWithProfile,
  ParticipantProfile,
  ConversationParticipant,
  MessageType
} from '@/types/messaging';

export interface UseMessagingReturn {
  conversations: ConversationWithDetails[];
  loading: boolean;
  error: Error | null;
  fetchConversations: (isBackground?: boolean) => Promise<void>;
  getOrCreateDM: (otherUserId: string) => Promise<string | null>;
  createGroupChat: (name: string, participantIds: string[], avatarUrl?: string) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, messageType?: MessageType, mediaUrl?: string | null, mediaMetadata?: Record<string, unknown> | null, replyToId?: string | null) => Promise<string | null>;
  getUnreadCount: (conversationId: string) => Promise<number>;
}

export function useMessaging(): UseMessagingReturn {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async (isBackground = false) => {
    if (!user) {
      setConversations([]);
      setInitialLoading(false);
      return;
    }

    if (!isBackground) {
      setInitialLoading(true);
    }
    setError(null);

    try {
      // Step 1: Get all conversation IDs where user is a participant (not archived)
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (participantError) throw participantError;

      if (!participantData?.length) {
        setConversations([]);
        setInitialLoading(false);
        return;
      }

      const conversationIds = participantData
        .map(p => p.conversation_id)
        .filter((id): id is string => id !== null);

      // Create a map of last_read_at by conversation_id for the current user
      const lastReadMap = new Map<string, string | null>();
      participantData.forEach(p => {
        if (p.conversation_id) {
          lastReadMap.set(p.conversation_id, p.last_read_at);
        }
      });

      // Step 2: Fetch conversations with all their participants
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          name,
          avatar_url,
          created_by,
          created_at,
          updated_at,
          last_message_at,
          last_message_preview, 
          conversation_participants (
            id,
            conversation_id,
            user_id,
            role,
            joined_at,
            last_read_at,
            is_muted,
            is_archived
          )
        `)
        .in('id', conversationIds)
        .is('deleted_at', null)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      if (!conversationsData?.length) {
        setConversations([]);
        setInitialLoading(false);
        return;
      }

      // Step 3: Get all unique user IDs from participants
      const allUserIds = new Set<string>();
      conversationsData.forEach(conv => {
        const participants = conv.conversation_participants as ConversationParticipant[] | null;
        participants?.forEach(p => {
          if (p.user_id) allUserIds.add(p.user_id);
        });
      });

      // Step 4: Fetch profiles for all participants
      const { data: profilesData, error: profilesError } = await supabase
        .from('public_profiles')
        .select('id, username, display_name, profile_photo_url, eg_handicap_index, home_club')
        .in('id', Array.from(allUserIds));

      if (profilesError) throw profilesError;

      // Create profile lookup map
      const profilesMap = new Map<string, ParticipantProfile>();
      profilesData?.forEach(profile => {
        if (profile.id) {
          profilesMap.set(profile.id, {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            profile_photo_url: profile.profile_photo_url,
            eg_handicap_index: profile.eg_handicap_index ?? null,
            home_club: profile.home_club ?? null,
          });
        }
      });

      // Step 5: Fetch last message sender for each conversation via RPC
      const { data: lastMessagesData } = await supabase
        .rpc('get_conversation_last_senders', {
          p_conversation_ids: conversationIds,
        });

      // Create a map of conversation_id -> last message sender_id
      const lastMessageSenderMap = new Map<string, { sender_id: string | null; created_at: string }>();
      lastMessagesData?.forEach(msg => {
        // Only keep the first (most recent) message per conversation
        if (!lastMessageSenderMap.has(msg.conversation_id)) {
          lastMessageSenderMap.set(msg.conversation_id, {
            sender_id: msg.sender_id,
            created_at: msg.created_at,
          });
        }
      });

      // Step 6: Build final conversations with details
      const conversationsWithDetails: ConversationWithDetails[] = conversationsData.map(conv => {
        const rawParticipants = conv.conversation_participants as ConversationParticipant[] | null;
        
        const participants: ParticipantWithProfile[] = (rawParticipants || []).map(p => ({
          id: p.id,
          conversation_id: p.conversation_id,
          user_id: p.user_id,
          role: p.role as 'admin' | 'member',
          joined_at: p.joined_at,
          last_read_at: p.last_read_at,
          is_muted: p.is_muted,
          is_archived: p.is_archived,
          profile: p.user_id ? profilesMap.get(p.user_id) || null : null,
        }));

        // Get last message info
        const lastMsgInfo = lastMessageSenderMap.get(conv.id);
        const lastMsgSenderId = lastMsgInfo?.sender_id;
        
        // Calculate unread: only count if last message is NOT from current user
        // AND last_message_at > current user's last_read_at
        const myLastRead = lastReadMap.get(conv.id);
        
        // If the last message is from the current user, no unread
        const isOwnLastMessage = lastMsgSenderId === user.id;
        
        const hasUnread = !isOwnLastMessage && conv.last_message_at && myLastRead 
          ? new Date(conv.last_message_at) > new Date(myLastRead)
          : !isOwnLastMessage && conv.last_message_at !== null && myLastRead === null;

        return {
          id: conv.id,
          type: conv.type as ConversationWithDetails['type'],
          name: conv.name,
          avatar_url: conv.avatar_url,
          created_by: conv.created_by,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          last_message_preview: conv.last_message_preview,
          participants,
          unread_count: hasUnread ? 1 : 0, // Simplified; can use get_unread_count RPC for exact count
        };
      });

      setConversations(conversationsWithDetails);
    } catch (err) {
      AppLog.error('[useMessaging]', 'Error fetching conversations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  /**
   * Get or create a direct message conversation with another user
   */
  const getOrCreateDM = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_or_create_dm_conversation', {
        other_user_id: otherUserId,
      });

      if (error) throw error;
      
      // Refresh conversations after creating/getting DM
      await fetchConversations(true);
      
      return data as string;
    } catch (err) {
      AppLog.error('[useMessaging]', 'Error getting/creating DM:', err);
      setError(err instanceof Error ? err : new Error('Failed to get or create DM'));
      return null;
    }
  }, [user, fetchConversations]);

  /**
   * Create a new group chat with specified participants
   */
  const createGroupChat = useCallback(async (name: string, participantIds: string[], avatarUrl?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('create_group_conversation', {
        group_name: name,
        participant_ids: participantIds,
        group_avatar_url: avatarUrl || null,
      });

      if (error) throw error;
      
      // Refresh conversations after creating group
      await fetchConversations(true);
      
      return data as string;
    } catch (err) {
      AppLog.error('[useMessaging]', 'Error creating group chat:', err);
      setError(err instanceof Error ? err : new Error('Failed to create group chat'));
      return null;
    }
  }, [user, fetchConversations]);

  /**
   * Mark a conversation as read (updates last_read_at)
   */
  const markAsRead = useCallback(async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      // 1. Mark conversation as read in messaging system
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
      });

      if (error) throw error;
      
      // 2. Update local state immediately
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      
      // 3. Clean up any legacy message notifications for this conversation
      // (Belt-and-suspenders - the RPC also does this, but we do it client-side too)
      await supabase
        .from('notifications')
        .update({ is_read: true, read: true })
        .eq('user_id', user.id)
        .in('type', ['message', 'message_received', 'dm'])
        .eq('is_read', false)
        .contains('data', { conversation_id: conversationId });
      
      // 4. Invalidate activity/notification queries to update badges
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    } catch (err) {
      AppLog.error('[useMessaging]', 'Error marking as read:', err);
    }
  }, [user, queryClient]);

  /**
   * Send a message to a conversation
   */
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    messageType: MessageType = 'text',
    mediaUrl: string | null = null,
    mediaMetadata: Record<string, unknown> | null = null,
    replyToId: string | null = null
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: messageType,
        p_media_url: mediaUrl,
        p_media_metadata: mediaMetadata ? JSON.parse(JSON.stringify(mediaMetadata)) : null,
        p_reply_to_id: replyToId,
      });

      if (error) throw error;
      
      // Immediately mark conversation as read since user just sent a message
      // This ensures their own message doesn't show as unread
      await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
      });
      
      // Update local state immediately to show no unread
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0, last_message_at: new Date().toISOString(), last_message_preview: content }
            : conv
        )
      );
      
      // Invalidate activity/notification queries
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      
      return data as string;
    } catch (err) {
      AppLog.error('[useMessaging]', 'Error sending message:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      return null;
    }
  }, [user, queryClient]);

  /**
   * Get unread count for a specific conversation
   */
  const getUnreadCount = useCallback(async (conversationId: string): Promise<number> => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase.rpc('get_unread_count', {
        p_conversation_id: conversationId,
      });

      if (error) throw error;
      
      return (data as number) || 0;
    } catch (err) {
      AppLog.error('[useMessaging]', 'Error getting unread count:', err);
      return 0;
    }
  }, [user]);

  // Fetch conversations on mount and when user changes
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Keep a ref of conversation IDs to avoid stale closures in realtime callbacks
  const conversationsRef = useRef<ConversationWithDetails[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Set up realtime subscription for conversation updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages — only refetch if message belongs to a known conversation
    const messagesChannel = supabase
      .channel(`conversation-list-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const incomingConvId = (payload.new as Record<string, unknown>)?.conversation_id;
          if (incomingConvId && conversationsRef.current.some(c => c.id === incomingConvId)) {
            fetchConversations(true);
          }
        }
      )
      .subscribe();

    // Filter by this user's participation row — avoids a thundering herd where every
    // connected client re-fetches on any global conversation write.
    const conversationsChannel = supabase
      .channel(`conversation-list-participants-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchConversations(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    loading: initialLoading,
    error,
    fetchConversations,
    getOrCreateDM,
    createGroupChat,
    markAsRead,
    sendMessage,
    getUnreadCount,
  };
}
