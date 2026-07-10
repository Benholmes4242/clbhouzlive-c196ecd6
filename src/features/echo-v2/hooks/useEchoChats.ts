import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EchoChatRow {
  id: string;
  title: string | null;
  pinned: boolean;
  last_message_at: string | null;
}

export function useEchoChats() {
  return useQuery<EchoChatRow[]>({
    queryKey: ['echo-v2', 'chats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('echo_chats')
        .select('id,title,pinned,last_message_at')
        .order('pinned', { ascending: false })
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as EchoChatRow[];
    },
    staleTime: 30_000,
  });
}
