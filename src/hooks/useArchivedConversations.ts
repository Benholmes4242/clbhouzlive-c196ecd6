import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';
import { ConversationWithDetails, ParticipantProfile, ParticipantWithProfile } from '@/types/messaging';

/** Shape returned by the nested conversation select */
interface ArchivedParticipantRow {
  conversation: {
    id: string;
    type: string;
    name: string | null;
    avatar_url: string | null;
    created_by: string | null;
    created_at: string | null;
    updated_at: string | null;
    last_message_at: string | null;
    last_message_preview: string | null;
  } | null;
}

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

      const rows = (data || []) as unknown as ArchivedParticipantRow[];

      // Get all conversation IDs
      const conversationIds = rows
        .map(item => item.conversation?.id)
        .filter((id): id is string => id != null);

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
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, eg_handicap_index, home_club')
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
            eg_handicap_index: profile.eg_handicap_index ?? null,
            home_club: profile.home_club ?? null,
          });
        }
      });

      // Group participants by conversation
      const participantsByConv = new Map<string, typeof allParticipants>();
      (allParticipants || []).forEach(p => {
        if (p.conversation_id) {
          const existing = participantsByConv.get(p.conversation_id) || [];
          existing.push(p);
          participantsByConv.set(p.conversation_id, existing);
        }
      });

      // Build conversations with full profile data
      const conversations = rows.map(item => {
        const conv = item.conversation;
        if (!conv) return null;

        const rawParticipants = participantsByConv.get(conv.id) || [];
        const participants: ParticipantWithProfile[] = rawParticipants.map(p => ({
          id: p.id,
          conversation_id: p.conversation_id ?? '',
          user_id: p.user_id ?? '',
          role: (p.role as 'admin' | 'member') ?? 'member',
          joined_at: p.joined_at ?? '',
          last_read_at: p.last_read_at,
          is_muted: p.is_muted ?? false,
          is_archived: p.is_archived ?? false,
          profile: p.user_id ? profilesMap.get(p.user_id) || null : null,
        }));

        return {
          id: conv.id,
          type: conv.type,
          name: conv.name,
          avatar_url: conv.avatar_url,
          created_by: conv.created_by,
          created_at: conv.created_at ?? '',
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          last_message_preview: conv.last_message_preview,
          participants,
          unread_count: 0,
        } as ConversationWithDetails;
      }).filter(Boolean) as ConversationWithDetails[];
      
      setArchivedConversations(conversations);
    } catch (error) {
      AppLog.error('[useArchivedConversations]', 'Error fetching archived:', error);
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
      AppLog.error('[useArchivedConversations]', 'Error unarchiving:', error);
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