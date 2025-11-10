import { supabase } from '@/integrations/supabase/client';

export async function bulkAddTagsToThreads(threadIds: string[], names: string[]) {
  const { error } = await supabase.rpc('echo_tags_bulk_add_to_threads', {
    p_thread_ids: threadIds,
    p_names: names,
  });
  if (error) throw error;
}

export async function bulkRemoveTagsFromThreads(threadIds: string[], names: string[]) {
  const { error } = await supabase.rpc('echo_tags_bulk_remove_from_threads', {
    p_thread_ids: threadIds,
    p_names: names,
  });
  if (error) throw error;
}
