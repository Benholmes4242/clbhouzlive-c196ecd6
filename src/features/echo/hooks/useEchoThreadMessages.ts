import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EchoMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

export function useEchoThreadMessages(sessionId?: string) {
  return useQuery({
    queryKey: ['echo-session-messages', sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<EchoMessage[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return [];

      // Try to find a thread associated with this session
      const { data: threadData } = await supabase
        .from('echo_threads')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!threadData) return [];

      const { data, error } = await supabase
        .from('echo_messages')
        .select('id, role, content, created_at')
        .eq('thread_id', threadData.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as EchoMessage[];
    },
  });
}
