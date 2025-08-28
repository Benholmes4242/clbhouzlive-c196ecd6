import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Message } from './useMessages';

export function useConversation(friendId: string | null) {
  const { user } = useSupabaseSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

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
    
    const setupSubscription = async () => {
      try {
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
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to conversation messages');
              } else if (status === 'CHANNEL_ERROR') {
                console.warn('Conversation messages realtime subscription failed - continuing without realtime updates');
              }
            });
        });
      } catch (error) {
        console.warn('Failed to setup conversation realtime subscription:', error);
        // App continues to work without realtime message updates
      }
    };

    setupSubscription();

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