/**
 * Bulk Actions API
 * Batch operations for Echo History threads
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Star/unstar multiple threads
 */
export async function bulkStarThreads(threadIds: string[], starred: boolean): Promise<void> {
  const { error } = await supabase.rpc('echo_threads_set_star', {
    ids: threadIds,
    starred,
  });

  if (error) {
    console.error('Failed to bulk star threads:', error);
    throw new Error(error.message || 'Failed to update starred status');
  }
}

/**
 * Delete multiple threads
 */
export async function bulkDeleteThreads(threadIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('echo_threads_delete_many', {
    ids: threadIds,
  });

  if (error) {
    console.error('Failed to bulk delete threads:', error);
    throw new Error(error.message || 'Failed to delete conversations');
  }
}
