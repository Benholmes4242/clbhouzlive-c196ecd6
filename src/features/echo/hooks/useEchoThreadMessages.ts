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
    queryKey: ['echo-thread', threadId],
    enabled: !!threadId,
    queryFn: async (): Promise<EchoMessage[]> => {
      if (!threadId) return [];

      const { data, error } = await supabase
        .from('echo_messages')
        .select('id, role, content, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as EchoMessage[];
    },
  });
}
