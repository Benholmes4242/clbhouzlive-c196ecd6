import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationWithDetails, ConversationParticipant, ParticipantProfile, ParticipantWithProfile } from '@/types/messaging';

export const useArchivedConversations = () => {
  const [archivedConversations, setArchivedConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    fetchUser();
  }, []);

  const fetchArchived = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation:conversations(
            id, type, name, avatar_url, created_by, created_at, 
            updated_at, last_message_at, last_message_preview
          )
        `)
        .eq('user_id', userId)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });
        
      if (error) throw error;

      // Get all conversation IDs
      const conversationIds = (data || [])
        .map(item => (item.conversation as any)?.id)
        .filter((id): id is string => id !== null);

      if (conversationIds.length === 0) {
        setArchivedConversations([]);
        setIsLoading(false);
        return;
      }

      // Fetch all participants for these conversations in one query
      const { data: allParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('id, conversation_id, user_id, role, joined_at, last_read_at, is_muted, is_archived')
        .in('conversation_id', conversationIds);

      if (participantsError) throw participantsError;

      // Get all unique user IDs from participants
      const allUserIds = new Set<string>();
      (allParticipants || []).forEach(p => {
        if (p.user_id) allUserIds.add(p.user_id);
      });

      // Fetch all profiles in one query
      const { data: profilesData } = await supabase
        .from('public_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', Array.from(allUserIds));

      // Create profile lookup map
      const profilesMap = new Map<string, ParticipantProfile>();
      profilesData?.forEach(profile => {
        if (profile.id) {
          profilesMap.set(profile.id, {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            profile_photo_url: profile.profile_photo_url,
          });
        }
      });

      // Group participants by conversation
      const participantsByConv = new Map<string, any[]>();
      (allParticipants || []).forEach(p => {
        if (p.conversation_id) {
          const existing = participantsByConv.get(p.conversation_id) || [];
          existing.push(p);
          participantsByConv.set(p.conversation_id, existing);
        }
      });

      // Build conversations with full profile data
      const conversations = (data || []).map(item => {
        const conv = item.conversation as any;
        if (!conv) return null;

        const rawParticipants = participantsByConv.get(conv.id) || [];
        const participants: ParticipantWithProfile[] = rawParticipants.map(p => ({
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

        return {
          ...conv,
          participants,
          unread_count: 0,
        } as ConversationWithDetails;
      }).filter(Boolean);
      
      setArchivedConversations(conversations.filter(Boolean) as ConversationWithDetails[]);
    } catch (error) {
      console.error('Error fetching archived:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const unarchive = async (conversationId: string) => {
    try {
      const { error } = await supabase.rpc('toggle_conversation_archive', {
        p_conversation_id: conversationId,
        p_archive: false,
      });
      
      if (error) throw error;
      
      setArchivedConversations(prev => 
        prev.filter(c => c.id !== conversationId)
      );
      
      return true;
    } catch (error) {
      console.error('Error unarchiving:', error);
      return false;
    }
  };

  useEffect(() => {
    if (userId) fetchArchived();
  }, [fetchArchived, userId]);

  return {
    archivedConversations,
    isLoading,
    refetch: fetchArchived,
    unarchive,
    hasArchived: archivedConversations.length > 0,
  };
};
