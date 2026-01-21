import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type EchoPreview = { preview: string; when: string } | null;

async function fetchRecentEchoPreview(): Promise<EchoPreview> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch from echo_threads with most recent message
  const { data: threads, error: threadErr } = await supabase
    .from('echo_threads')
    .select('id, first_user_question, last_activity_at')
    .eq('user_id', user.id)
    .order('last_activity_at', { ascending: false, nullsFirst: false })
    .limit(1);

  if (threadErr || !threads?.length) return null;

  // Get the most recent message from this thread
  const { data: msgs, error: msgErr } = await supabase
    .from('echo_messages')
    .select('content, created_at')
    .eq('thread_id', threads[0].id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (msgErr || !msgs?.length) {
    // Return thread question if no messages
    return { 
      preview: threads[0].first_user_question || 'Empty conversation', 
      when: threads[0].last_activity_at || new Date().toISOString()
    };
  }

  return { 
    preview: msgs[0].content?.replace(/\s+/g, ' ').trim() || 'Empty conversation', 
    when: msgs[0].created_at 
  };
}

export function useEchoHistory() {
  return useQuery({
    queryKey: ['echoRecentPreview'],
    queryFn: fetchRecentEchoPreview,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
