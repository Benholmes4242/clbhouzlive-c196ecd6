import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { 
  ConversationWithDetails, 
  ParticipantWithProfile,
  ParticipantProfile 
} from '@/types/messaging';

interface UseMessagingReturn {
  conversations: ConversationWithDetails[];
  loading: boolean;
  error: Error | null;
  fetchConversations: () => Promise<void>;
  getOrCreateDM: (otherUserId: string) => Promise<string | null>;
  createGroupChat: (name: string, participantIds: string[]) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
}

export function useMessaging(): UseMessagingReturn {
  const { user } = useSupabaseSession();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (participantError) throw participantError;

      if (!participantData?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData
        .map(p => p.conversation_id)
        .filter((id): id is string => id !== null);

      // Fetch conversations with all participants
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
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      if (!conversationsData?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get all unique user IDs from participants
      const allUserIds = new Set<string>();
      conversationsData.forEach(conv => {
        conv.conversation_participants?.forEach(p => {
          if (p.user_id) allUserIds.add(p.user_id);
        });
      });

      // Fetch profiles for all participants using public_profiles view
      const { data: profilesData, error: profilesError } = await supabase
        .from('public_profiles')
        .select('id, username, profile_photo_url, display_name')
        .in('id', Array.from(allUserIds));

      if (profilesError) throw profilesError;

      const profilesMap = new Map<string, ParticipantProfile>();
      profilesData?.forEach(profile => {
        if (profile.id) {
          profilesMap.set(profile.id, {
            id: profile.id,
            username: profile.username,
            profile_photo_url: profile.profile_photo_url,
            display_name: profile.display_name,
          });
        }
      });

      // Calculate unread counts and build final data
      const conversationsWithDetails: ConversationWithDetails[] = conversationsData.map(conv => {
        const participants: ParticipantWithProfile[] = (conv.conversation_participants || []).map(p => ({
          id: p.id,
          conversation_id: p.conversation_id,
          user_id: p.user_id,
          role: p.role as 'admin' | 'member' | null,
          joined_at: p.joined_at,
          last_read_at: p.last_read_at,
          is_muted: p.is_muted,
          is_archived: p.is_archived,
          profile: p.user_id ? profilesMap.get(p.user_id) || null : null,
        }));

        // Find current user's participant record for unread calculation
        const myParticipant = participants.find(p => p.user_id === user.id);
        const lastReadAt = myParticipant?.last_read_at;
        
        // Simple unread check: if last_message_at > last_read_at
        const hasUnread = conv.last_message_at && lastReadAt 
          ? new Date(conv.last_message_at) > new Date(lastReadAt)
          : conv.last_message_at !== null && lastReadAt === null;

        return {
          id: conv.id,
          type: conv.type as ConversationWithDetails['type'],
          name: conv.name,
          avatar_url: conv.avatar_url,
          created_by: conv.created_by,
          created_at: conv.created_at || new Date().toISOString(),
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          last_message_preview: conv.last_message_preview,
          participants,
          unread_count: hasUnread ? 1 : 0, // Simplified; could be enhanced with actual count
        };
      });

      setConversations(conversationsWithDetails);
    } catch (err) {
      console.error('[useMessaging] Error fetching conversations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getOrCreateDM = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_or_create_dm_conversation', {
        other_user_id: otherUserId,
      });

      if (error) throw error;
      
      // Refresh conversations after creating/getting DM
      await fetchConversations();
      
      return data as string;
    } catch (err) {
      console.error('[useMessaging] Error getting/creating DM:', err);
      setError(err instanceof Error ? err : new Error('Failed to get or create DM'));
      return null;
    }
  }, [user, fetchConversations]);

  const createGroupChat = useCallback(async (name: string, participantIds: string[]): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('create_group_conversation', {
        group_name: name,
        participant_ids: participantIds,
      });

      if (error) throw error;
      
      // Refresh conversations after creating group
      await fetchConversations();
      
      return data as string;
    } catch (err) {
      console.error('[useMessaging] Error creating group chat:', err);
      setError(err instanceof Error ? err : new Error('Failed to create group chat'));
      return null;
    }
  }, [user, fetchConversations]);

  const markAsRead = useCallback(async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
      });

      if (error) throw error;
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('[useMessaging] Error marking as read:', err);
    }
  }, [user]);

  // Fetch conversations on mount and when user changes
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    getOrCreateDM,
    createGroupChat,
    markAsRead,
  };
}
