import { supabase } from "@/integrations/supabase/client";

/**
 * Add tags to a thread (appends to existing tags)
 */
export async function addTagsToThread(threadId: string, names: string[]): Promise<void> {
  const { error } = await supabase.rpc('echo_tags_add_to_thread', {
    p_thread: threadId,
    p_names: names,
  });

  if (error) {
    console.error('Failed to add tags:', error);
    throw new Error(`Failed to add tags: ${error.message}`);
  }
}

/**
 * Set all tags for a thread (replaces existing tags)
 */
export async function setTagsForThread(threadId: string, names: string[]): Promise<void> {
  const { error } = await supabase.rpc('echo_tags_set_for_thread', {
    p_thread: threadId,
    p_names: names,
  });

  if (error) {
    console.error('Failed to set tags:', error);
    throw new Error(`Failed to set tags: ${error.message}`);
  }
}

/**
 * Remove a single tag from a thread
 */
export async function removeTagFromThread(threadId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc('echo_tags_remove_from_thread', {
    p_thread: threadId,
    p_name: name,
  });

  if (error) {
    console.error('Failed to remove tag:', error);
    throw new Error(`Failed to remove tag: ${error.message}`);
  }
}

/**
 * Get tag suggestions based on prefix (autocomplete)
 */
export async function suggestTags(prefix?: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('echo_tags_suggest', {
    p_prefix: prefix || null,
    p_limit: 10,
  });

  if (error) {
    console.error('Failed to get tag suggestions:', error);
    return [];
  }

  return (data || []).map((row: any) => row.name);
}

/**
 * Get all tags for a specific thread
 */
export async function getThreadTags(threadId: string): Promise<string[]> {
  // First get the tag IDs for this thread
  const { data: threadTagData, error: threadError } = await supabase
    .from('echo_thread_tags')
    .select('tag_id')
    .eq('thread_id', threadId);

  if (threadError) {
    console.error('Failed to get thread tag IDs:', threadError);
    return [];
  }

  if (!threadTagData || threadTagData.length === 0) {
    return [];
  }

  // Then get the tag names
  const tagIds = threadTagData.map(item => item.tag_id);
  const { data: tagData, error: tagError } = await supabase
    .from('echo_tags')
    .select('name')
    .in('id', tagIds);

  if (tagError) {
    console.error('Failed to get tag names:', tagError);
    return [];
  }

  return (tagData || []).map(item => item.name);
}
