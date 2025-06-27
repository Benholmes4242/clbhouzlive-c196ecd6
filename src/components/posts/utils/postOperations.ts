
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

export const createTagNotifications = async (
  postId: string,
  selectedTags: TaggableEntity[],
  userId: string
): Promise<void> => {
  // Only create notifications for user tags
  const userTags = selectedTags.filter(tag => tag.entity_type === 'user');
  
  if (userTags.length === 0) return;

  // Get the post creator's info
  const { data: creatorData, error: creatorError } = await supabase
    .from('user_profiles')
    .select('display_name, username')
    .eq('id', userId)
    .single();

  if (creatorError) {
    console.error('Error fetching creator info:', creatorError);
    return;
  }

  const creatorName = creatorData?.display_name || creatorData?.username || 'Someone';

  // Create notifications for each tagged user
  for (const tag of userTags) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: tag.entity_id,
          type: 'tag',
          title: 'You were mentioned in a post',
          message: `${creatorName} mentioned you in a post`,
          data: {
            post_id: postId,
            tagged_by_user_id: userId,
            tagger_name: creatorName
          }
        });

      if (error) {
        console.error('Error creating tag notification:', error);
      }
    } catch (error) {
      console.error('Error creating notification for tag:', tag.id, error);
    }
  }
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
