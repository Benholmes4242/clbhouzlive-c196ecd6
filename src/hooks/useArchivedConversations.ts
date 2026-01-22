import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationWithDetails } from '@/types/messaging';

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
      
      // Transform and fetch participants for each
      const conversations = await Promise.all(
        (data || []).map(async (item) => {
          const conv = item.conversation as any;
          if (!conv) return null;
          
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              id, conversation_id, user_id, role, joined_at, last_read_at, is_muted, is_archived,
              profile:user_profiles(id, username, display_name, profile_photo_url)
            `)
            .eq('conversation_id', conv.id);
            
          return {
            ...conv,
            participants: (participants || []).map(p => ({
              ...p,
              profile: p.profile ? {
                id: (p.profile as any).id,
                username: (p.profile as any).username,
                display_name: (p.profile as any).display_name,
                profile_photo_url: (p.profile as any).profile_photo_url,
              } : null,
            })),
            unread_count: 0,
          };
        })
      );
      
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
