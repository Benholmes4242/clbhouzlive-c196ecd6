import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MESSAGE } from '@/lib/supabase/selects';
import { Message } from './useMessages';

export function useConversation(friendId: string | null) {
  const { user } = useSupabaseSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) return;
    
    setLoading(true);
    // Note: This uses legacy message columns - type assertion to handle schema mismatch
    const { data, error } = await (supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, read, created_at, updated_at')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true })) as any;

    if (!error && data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  }, [user, friendId]);

  useEffect(() => {
    if (!user || !friendId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();
    
    // Set up real-time subscription for this conversation
    const channelName = `conversation_${user.id}_${friendId}`;
    
    import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
      const channel = channelManager.createChannel(channelName);
      
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id}))`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();
    });

    return () => {
      import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
        channelManager.removeChannel(channelName);
      });
    };
  }, [user, friendId, fetchMessages]);

  return {
    messages,
    loading,
    refetch: fetchMessages
  };
}