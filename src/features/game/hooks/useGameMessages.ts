import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { channelManager } from '@/utils/supabaseChannelManager';

interface GameThread {
  id: string;
  game_id: string;
  expires_at: string;
  grace_hours: number;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

interface GameMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  is_system: boolean;
  attachments: any;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    profile_photo_url?: string;
  };
}

export function useGameMessages(gameId: string | null) {
  const [thread, setThread] = useState<GameThread | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  

  useEffect(() => {
    if (!gameId) {
      setIsLoading(false);
      return;
    }

    setupThread();

    return () => {
      if (thread?.id) {
        channelManager.removeChannel(`game-messages:${thread.id}`);
      }
    };
  }, [gameId]);

  const setupThread = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);

      // Ensure thread exists (RPCs handle creation if needed)
      await supabase.rpc('game_thread_open_for_game', { p_game_id: gameId });

      // Fetch thread
      const { data: threadData, error: threadError } = await supabase
        .from('game_threads')
        .select('id, game_id, expires_at, grace_hours, is_closed, created_at, updated_at')
        .eq('game_id', gameId)
        .single();

      if (threadError) throw threadError;

      setThread(threadData);

      // Fetch messages
      await fetchMessages(threadData.id);

      // Subscribe to new messages
      setupRealtimeSubscription(threadData.id);
    } catch (error) {
      console.error('Error setting up thread:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    // Single joined query to avoid N+1 lookups
    const { data, error } = await supabase
      .from('game_thread_messages')
      .select(`
        id,
        thread_id,
        sender_id,
        text,
        is_system,
        attachments,
        created_at,
        sender:user_profiles (
          id,
          display_name,
          profile_photo_url
        )
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages((data as any) || []);
  };

  const setupRealtimeSubscription = (threadId: string) => {
    const channel = channelManager.createChannel(`game-messages:${threadId}`);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_thread_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          fetchMessages(threadId);
        }
      )
      .subscribe();
  };

  const sendMessage = async (text: string) => {
    if (!thread || !text.trim()) return;

    try {
      setIsSending(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('game_thread_messages')
        .insert({
          thread_id: thread.id,
          sender_id: user.id,
          text: text.trim(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const isThreadExpired = () => {
    if (!thread) return false;
    const expiryWithGrace = new Date(thread.expires_at).getTime() + (thread.grace_hours * 3600 * 1000);
    return Date.now() > expiryWithGrace;
  };

  return {
    thread,
    messages,
    isLoading,
    isSending,
    sendMessage,
    isThreadExpired: isThreadExpired(),
  };
}
