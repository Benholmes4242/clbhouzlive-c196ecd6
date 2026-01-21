import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EchoMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

export function useEchoThreadMessages(threadId?: string | null) {
  return useQuery({
    queryKey: ['echo.inline.messages', threadId],
    enabled: !!threadId,
    staleTime: 30_000,
    queryFn: async (): Promise<EchoMessage[]> => {
      if (!threadId) return [];

      // Fetch from echo_messages table
      const { data, error } = await supabase
        .from('echo_messages')
        .select('id, role, content, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useEchoThreadMessages] Error fetching messages:', error);
        return [];
      }

      return (data || []) as EchoMessage[];
    },
  });
}
