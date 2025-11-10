/**
 * Conversation Tags API
 * Add, remove, and fetch tags for conversations
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Add a tag to a conversation
 */
export async function addTag(threadId: string, tag: string): Promise<void> {
  const { error } = await supabase.rpc('echo_tag_add', {
    p_thread: threadId,
    p_tag: tag,
  });

  if (error) {
    console.error('Failed to add tag:', error);
    throw new Error(error.message || 'Failed to add tag');
  }
}

/**
 * Remove a tag from a conversation
 */
export async function removeTag(threadId: string, tag: string): Promise<void> {
  const { error } = await supabase.rpc('echo_tag_remove', {
    p_thread: threadId,
    p_tag: tag,
  });

  if (error) {
    console.error('Failed to remove tag:', error);
    throw new Error(error.message || 'Failed to remove tag');
  }
}

/**
 * Get tags for a conversation
 */
export async function getTags(threadId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('echo_thread_tags')
    .select('tag')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch tags:', error);
    return [];
  }

  return data?.map((t) => t.tag) || [];
}

/**
 * Get all unique tags for the current user
 */
export async function getAllUserTags(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('echo_thread_tags')
    .select('tag')
    .eq('user_id', user.id)
    .order('tag', { ascending: true });

  if (error) {
    console.error('Failed to fetch user tags:', error);
    return [];
  }

  // Get unique tags
  const uniqueTags = Array.from(new Set(data?.map((t) => t.tag) || []));
  return uniqueTags;
}
