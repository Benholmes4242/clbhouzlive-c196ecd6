import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';
import type { MessageWithSender, ParticipantProfile, Message } from '@/types/messaging';

interface UseConversationMessagesReturn {
  messages: MessageWithSender[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (content: string, replyToId?: string | null, mediaUrl?: string, mediaType?: string, mediaMetadata?: Record<string, unknown> | null) => Promise<string | null>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
}

const PAGE_SIZE = 50;

export function useConversationMessages(conversationId: string | null): UseConversationMessagesReturn {
  const { user } = useSupabaseSession();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  const fetchMessages = useCallback(async (offset = 0, append = false) => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    if (!append) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch messages for this conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (messagesError) throw messagesError;

      if (!messagesData?.length) {
        if (!append) {
          setMessages([]);
        }
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Collect all sender IDs
      const senderIds = new Set<string>();
      messagesData.forEach(m => {
        if (m.sender_id) senderIds.add(m.sender_id);
      });

      // Fetch sender profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, eg_handicap_index, home_club')
        .in('id', Array.from(senderIds));

      if (profilesError) throw profilesError;

      // Create profile lookup
      const profilesMap = new Map<string, ParticipantProfile>();
      profilesData?.forEach(p => {
        if (p.id) {
          profilesMap.set(p.id, {
            id: p.id,
            username: p.username,
            display_name: p.display_name,
            profile_photo_url: p.profile_photo_url,
            eg_handicap_index: p.eg_handicap_index ?? null,
            home_club: p.home_club ?? null,
          });
        }
      });

      // Fetch reply-to messages if any
      const replyToIds = messagesData
        .map(m => m.reply_to_id)
        .filter((id): id is string => id !== null);

      let replyToMap = new Map<string, Message>();
      if (replyToIds.length > 0) {
        const { data: replyData } = await supabase
          .from('messages')
          .select('*')
          .in('id', replyToIds);
        
        replyData?.forEach(r => {
          replyToMap.set(r.id, r as Message);
        });
      }

      // Build messages with sender info
      const messagesWithSender: MessageWithSender[] = messagesData.map(m => ({
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        content: m.content,
        message_type: m.message_type as MessageWithSender['message_type'],
        media_url: m.media_url,
        media_metadata: m.media_metadata as Record<string, unknown> | null,
        reply_to_id: m.reply_to_id,
        is_edited: m.is_edited || false,
        edited_at: m.edited_at,
        deleted_at: m.deleted_at,
        created_at: m.created_at,
        sender: m.sender_id ? profilesMap.get(m.sender_id) || null : null,
      }));

      // Reverse to show oldest first (chat order)
      const orderedMessages = messagesWithSender.reverse();

      if (append) {
        setMessages(prev => [...orderedMessages, ...prev]);
      } else {
        setMessages(orderedMessages);
      }

      setHasMore(messagesData.length === PAGE_SIZE);
      offsetRef.current = offset + messagesData.length;
    } catch (err) {
      AppLog.error('[useConversationMessages]', 'Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  const loadMore = useCallback(async () => {
    await fetchMessages(offsetRef.current, true);
  }, [fetchMessages]);

  const refreshMessages = useCallback(async () => {
    offsetRef.current = 0;
    await fetchMessages(0, false);
  }, [fetchMessages]);

  const sendMessage = useCallback(async (
    content: string, 
    replyToId?: string | null,
    mediaUrl?: string,
    mediaType?: string,
    mediaMetadata?: Record<string, unknown> | null
  ): Promise<string | null> => {
    if (!conversationId || !user) return null;

    try {
      const { data, error } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: mediaType || 'text',
        p_media_url: mediaUrl || null,
        p_media_metadata: mediaMetadata ? JSON.parse(JSON.stringify(mediaMetadata)) : null,
        p_reply_to_id: replyToId || null,
      });

      if (error) throw error;

      // Refresh messages to show the new one
      await refreshMessages();
      
      return data as string;
    } catch (err) {
      AppLog.error('[useConversationMessages]', 'Error sending:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      return null;
    }
  }, [conversationId, user, refreshMessages]);

  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, content: newContent, is_edited: true, edited_at: new Date().toISOString() }
          : m
      ));

      return true;
    } catch (err) {
      AppLog.error('[useConversationMessages]', 'Error editing:', err);
      return false;
    }
  }, [user]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));

      return true;
    } catch (err) {
      AppLog.error('[useConversationMessages]', 'Error deleting:', err);
      return false;
    }
  }, [user]);

  // Fetch on mount and when conversationId changes
  useEffect(() => {
    offsetRef.current = 0;
    fetchMessages(0, false);
  }, [fetchMessages]);

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          refreshMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated.deleted_at) {
            setMessages(prev => prev.filter(m => m.id !== updated.id));
          } else {
            setMessages(prev => prev.map(m =>
              m.id === (updated.id as string)
                ? { ...m, content: updated.content as string, is_edited: updated.is_edited as boolean, edited_at: updated.edited_at as string | null }
                : m
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, refreshMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    refreshMessages,
  };
}
