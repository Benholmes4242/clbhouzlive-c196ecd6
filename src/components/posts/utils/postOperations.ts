/**
 * postOperations — post-related utilities.
 *
 * The user-mention/tag system was nuked. createPostTags / createTagNotifications
 * no longer exist. rollbackPost keeps working for post creation failures.
 */

import { supabase } from '@/integrations/supabase/client';

export const rollbackPost = async (postId: string): Promise<void> => {
  try {
    console.log('Rolling back post creation for:', postId);

    await supabase
      .from('post_media')
      .delete()
      .eq('post_id', postId);

    await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    console.log('Post rollback completed for:', postId);
  } catch (rollbackError) {
    console.error('Error during rollback:', rollbackError);
  }
};
