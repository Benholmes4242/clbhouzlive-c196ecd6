/**
 * useUnreadMessages - Hook for fetching unread message count
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnreadMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useUnreadMessages() {
  return useQuery<UnreadMessage[]>({
    queryKey: ['unread-messages'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // For now, return empty array - messages system can be integrated later
      // This is a placeholder that can be connected to your messaging system
      return [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadMessagesCount() {
  const { data: messages, isLoading } = useUnreadMessages();
  return {
    count: messages?.length || 0,
    isLoading,
  };
}
