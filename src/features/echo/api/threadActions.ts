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
  const { error } = await supabase.rpc('echo_thread_update_last_opened', { 
    p_thread: threadId 
  });
  if (error) throw error;
}
