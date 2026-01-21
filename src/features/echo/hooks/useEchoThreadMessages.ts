import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EchoMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

function mapLegacyMessages(raw: any[] | undefined): EchoMessage[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((m: any, i: number) => ({
    id: m.id ?? String(i),
    role: ((m.role || m.type || 'user').toLowerCase() === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content ?? '',
    created_at: m.created_at ?? m.timestamp ?? m.time ?? new Date(0).toISOString(),
  }));
}

export function useEchoThreadMessages(threadId?: string | null) {
  return useQuery({
    queryKey: ['echo.inline.messages', threadId],
    enabled: !!threadId,
    staleTime: 30_000,
    queryFn: async (): Promise<EchoMessage[]> => {
      if (!threadId) return [];

      // 1) Try new relational model
      const { data: rel, error: relErr } = await supabase
        .from('echo_messages')
        .select('id, role, content, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (relErr) {
        console.warn('[inline] echo_messages fetch error', relErr);
      }

      if (rel && rel.length > 0) return rel as EchoMessage[];

      // 2) Fallback to legacy conversations JSONB
      // Note: This uses legacy conversation columns - type assertion to handle schema mismatch
      const { data: legacy, error: legacyErr } = await (supabase
        .from('conversations')
        .select('messages')
        .eq('id', threadId)
        .maybeSingle()) as any;

      if (legacyErr) {
        console.error('[inline] conversations fallback error', legacyErr);
        return [];
      }

      return mapLegacyMessages(legacy?.messages as any);
    },
  });
}
