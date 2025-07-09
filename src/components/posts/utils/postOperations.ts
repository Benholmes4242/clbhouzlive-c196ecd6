
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

  console.log('Creating post tags for post:', postId, 'with tags:', selectedTags);

  // Tags feature temporarily disabled due to missing database tables
  console.log('Post tags creation skipped - feature disabled');
};

export const createTagNotifications = async (
  postId: string,
  selectedTags: TaggableEntity[],
  userId: string
): Promise<void> => {
  // Only create notifications for user tags that exist
  const userTags = selectedTags.filter(tag => tag.entity_type === 'user');
  
  if (userTags.length === 0) return;

  console.log('Creating tag notifications for:', userTags);

  // Tag notifications temporarily disabled due to missing database tables
  console.log('Tag notifications skipped - feature disabled');
};

export const rollbackPost = async (postId: string): Promise<void> => {
  try {
    console.log('Rolling back post creation for:', postId);
    
    // Delete post media
    await supabase
      .from('post_media')
      .delete()
      .eq('post_id', postId);

    // Post tags deletion skipped - table doesn't exist

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
