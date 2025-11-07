import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEchoChatThread(id: string) {
  return useQuery({
    queryKey: ['echo-thread', id],
    queryFn: async () => {
      // Fetch thread metadata
      const { data: thread, error: tErr } = await supabase
        .from('echo_threads')
        .select('id, created_at')
        .eq('id', id)
        .single();

      if (tErr) throw tErr;

      // Fetch messages for this thread
      const { data: msgs, error: mErr } = await supabase
        .from('echo_messages')
        .select('role, content, created_at')
        .eq('thread_id', id)
        .order('created_at', { ascending: true });

      if (mErr) throw mErr;

      return { meta: thread, messages: msgs ?? [] };
    },
  });
}
