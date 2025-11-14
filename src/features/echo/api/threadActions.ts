import { supabase } from '@/integrations/supabase/client';

export async function starThread(threadId: string, star: boolean) {
  const { error } = await supabase.rpc('echo_thread_set_star', { 
    p_thread: threadId, 
    p_star: star 
  });
  if (error) throw error;
}

export async function deleteThread(threadId: string) {
  const { error } = await supabase.rpc('echo_thread_delete', { 
    p_thread: threadId 
  });
  if (error) throw error;
}

export async function updateLastOpened(threadId: string) {
  const { error } = await supabase
    .from('echo_threads')
    .update({ last_opened_at: new Date().toISOString() } as any)
    .eq('id', threadId);
  if (error) throw error;
}
