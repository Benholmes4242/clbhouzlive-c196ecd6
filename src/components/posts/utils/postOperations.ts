
import { supabase } from '@/integrations/supabase/client';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

export const createPostTags = async (
  postId: string, 
  selectedTags: TaggableEntity[], 
  userId: string
): Promise<void> => {
  if (selectedTags.length === 0) return;

  const tagInserts = selectedTags.map(tag => ({
    post_id: postId,
    tagged_entity_id: tag.id,
    tagged_by_user_id: userId
  }));

  const { error } = await supabase
    .from('post_tags')
    .insert(tagInserts);

  if (error) throw error;
};

export const rollbackPost = async (postId: string): Promise<void> => {
  try {
    console.log('Rolling back post creation for:', postId);
    
    // Delete post media
    await supabase
      .from('post_media')
      .delete()
      .eq('post_id', postId);

    // Delete post tags
    await supabase
      .from('post_tags')
      .delete()
      .eq('post_id', postId);

    // Delete the post
    await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    console.log('Post rollback completed for:', postId);
  } catch (rollbackError) {
    console.error('Error during rollback:', rollbackError);
  }
};
