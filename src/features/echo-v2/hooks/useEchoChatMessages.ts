import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EchoMessageMeta {
  v?: string;
  /**
   * BRIEF_ECHO_CHAT §0.2 — THE QUESTION KIND, mapped server-side in
   * echo-intelligence-v2 (mapIntentsToKind) and carried on the EXISTING `meta`
   * event. The answer shape hangs off it. ABSENT means the client must fall
   * back to the least claiming shape: prose only, no chart, no source list, no
   * basis line.
   */
  kind?: 'your_golf' | 'course' | 'game';
  route?: 'single' | 'dual' | 'full' | 'live';
  strength?: number;
  engines?: number;
  live?: boolean;
  ms?: number;
  cached?: boolean;
  error?: string;
}

export interface EchoMessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta: EchoMessageMeta;
  created_at: string;
}

export function useEchoChatMessages(chatId: string | null) {
  return useQuery<EchoMessageRow[]>({
    queryKey: ['echo-v2', 'messages', chatId],
    enabled: !!chatId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('echo_chat_messages')
        .select('id,role,content,meta,created_at')
        .eq('chat_id', chatId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        meta: EchoMessageMeta | null;
        created_at: string;
      }>;
      return rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        meta: r.meta ?? {},
        created_at: r.created_at,
      }));
    },
    staleTime: 0,
  });
}
