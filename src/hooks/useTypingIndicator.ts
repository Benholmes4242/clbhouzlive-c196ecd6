import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';

interface TypingUser {
  user_id: string;
  name: string;
}

interface TypingIndicatorRow {
  user_id: string;
  started_at: string;
}

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useSupabaseSession();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingCallRef = useRef<number>(0);
  const DEBOUNCE_MS = 1000; // Debounce setTyping calls
  const AUTO_CLEAR_MS = 3000; // Auto-clear after 3 seconds of no input

  // Set typing indicator (debounced)
  const setTyping = useCallback(async () => {
    if (!conversationId || !user) return;
    
    const now = Date.now();
    if (now - lastTypingCallRef.current < DEBOUNCE_MS) {
      return;
    }
    lastTypingCallRef.current = now;

    try {
      await supabase.rpc('set_typing_indicator', { 
        p_conversation_id: conversationId 
      });
    } catch (error) {
      AppLog.error('[useTypingIndicator]', 'Error setting typing indicator:', error);
    }

    // Auto-clear after timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      clearTyping();
    }, AUTO_CLEAR_MS);
  }, [conversationId, user]);

  // Clear typing indicator
  const clearTyping = useCallback(async () => {
    if (!conversationId || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      await supabase.rpc('clear_typing_indicator', { 
        p_conversation_id: conversationId 
      });
    } catch (error) {
      AppLog.error('[useTypingIndicator]', 'Error clearing typing indicator:', error);
    }
  }, [conversationId, user]);

  // Subscribe to typing indicators for this conversation
  useEffect(() => {
    if (!conversationId || !user) {
      setTypingUsers([]);
      return;
    }

    // Fetch initial typing users
    const fetchTypingUsers = async () => {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('user_id, started_at')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id);

      if (error) {
        AppLog.error('[useTypingIndicator]', 'Error fetching typing indicators:', error);
        return;
      }

      // Filter out stale indicators (older than 10 seconds)
      const now = new Date();
      const typingData = data as unknown as TypingIndicatorRow[];
      const activeTyping = typingData.filter(t => {
        const startedAt = new Date(t.started_at);
        return (now.getTime() - startedAt.getTime()) < 10000;
      });

      if (activeTyping.length > 0) {
        // Fetch user profiles for typing users
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, display_name, username')
          .in('id', activeTyping.map(t => t.user_id));

        setTypingUsers(
          activeTyping.map(t => {
            const profile = profiles?.find(p => p.id === t.user_id);
            return {
              user_id: t.user_id,
              name: profile?.display_name || profile?.username || 'Someone',
            };
          })
        );
      } else {
        setTypingUsers([]);
      }
    };

    fetchTypingUsers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Refetch on any change
          fetchTypingUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user]);

  // Clear typing on unmount
  useEffect(() => {
    return () => {
      if (conversationId && user) {
        void (async () => {
          try {
            await supabase.rpc('clear_typing_indicator', { 
              p_conversation_id: conversationId 
            } as any);
          } catch {
            // Ignore errors on unmount
          }
        })();
      }
    };
  }, [conversationId, user]);

  return {
    typingUsers,
    setTyping,
    clearTyping,
  };
}
