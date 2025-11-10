import { supabase } from '@/integrations/supabase/client';

export type TagRow = {
  name: string;
  threads_count: number;
  last_used_at: string | null;
};

export async function listTagsWithCounts(): Promise<TagRow[]> {
  const { data, error } = await supabase.rpc('echo_tags_list_with_counts');
  if (error) throw error;
  return data ?? [];
}

export async function renameTag(oldName: string, newName: string): Promise<void> {
  const { error } = await supabase.rpc('echo_tags_rename', { p_old: oldName, p_new: newName });
  if (error) throw error;
}

export async function deleteTagEverywhere(name: string): Promise<void> {
  const { error } = await supabase.rpc('echo_tags_delete_everywhere', { p_name: name });
  if (error) throw error;
}
