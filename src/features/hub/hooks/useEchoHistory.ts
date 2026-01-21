import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type EchoPreview = { preview: string; when: string } | null;

async function fetchRecentEchoPreview(): Promise<EchoPreview> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) Legacy conversations first - type assertion to handle schema mismatch
  const { data: convs, error: convErr } = await (supabase
    .from('conversations')
    .select('id, title, updated_at, messages')
    .eq('user_id', user.id)
    .eq('conversation_type', 'chat')
    .order('updated_at', { ascending: false })
    .limit(1)) as any;

  if (!convErr && convs?.length) {
    const msgs = Array.isArray(convs[0].messages) ? convs[0].messages : [];
    const last = msgs.at(-1) as any;
    const text = String(last?.content ?? convs[0].title ?? 'Empty conversation');
    return { preview: text.replace(/\s+/g, ' ').trim(), when: convs[0].updated_at };
  }

  // 2) Fallback to new echo tables
  const { data: threads } = await supabase
    .from('echo_threads')
    .select('id, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!threads?.length) return null;

  const { data: msgs } = await supabase
    .from('echo_messages')
    .select('content, created_at')
    .eq('thread_id', threads[0].id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!msgs?.length) return null;
  return { preview: msgs[0].content, when: msgs[0].created_at };
}

export function useEchoHistory() {
  return useQuery({
    queryKey: ['echoRecentPreview'],
    queryFn: fetchRecentEchoPreview,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
