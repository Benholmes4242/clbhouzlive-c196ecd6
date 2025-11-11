import { supabase } from '@/integrations/supabase/client';

export async function bulkAddTagsToThreads(threadIds: string[], names: string[]) {
  const { error } = await supabase.rpc('echo_tags_add_bulk', {
    p_thread_ids: threadIds,
    p_names: names,
  });
  if (error) throw error;
}

export async function bulkRemoveTagsFromThreads(threadIds: string[], names: string[]) {
  const { error } = await supabase.rpc('echo_tags_remove_bulk', {
    p_thread_ids: threadIds,
    p_names: names,
  });
  if (error) throw error;
}
