
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

  // Validate that all tagged entities exist before creating post tags
  const entityIds = selectedTags.map(tag => tag.id);
  const { data: existingEntities, error: checkError } = await supabase
    .from('taggable_entities')
    .select('id')
    .in('id', entityIds);

  if (checkError) {
    console.error('Error checking taggable entities:', checkError);
    throw new Error(`Failed to validate tagged entities: ${checkError.message}`);
  }

  const existingEntityIds = new Set(existingEntities?.map(e => e.id) || []);
  const validTags = selectedTags.filter(tag => existingEntityIds.has(tag.id));
  
  if (validTags.length === 0) {
    console.log('No valid tags to create after validation');
    return;
  }

  if (validTags.length < selectedTags.length) {
    console.warn('Some tagged entities do not exist in database, proceeding with valid ones only');
  }

  const tagInserts = validTags.map(tag => ({
    post_id: postId,
    tagged_entity_id: tag.id,
    tagged_by_user_id: userId
  }));

  console.log('Inserting post tags:', tagInserts);

  const { error } = await supabase
    .from('post_tags')
    .insert(tagInserts);

  if (error) {
    console.error('Error inserting post tags:', error);
    throw new Error(`Failed to create post tags: ${error.message}`);
  }

  console.log('Post tags created successfully');
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

  // Verify these user entities exist in the database
  const userEntityIds = userTags.map(tag => tag.id);
  const { data: existingUserEntities, error: checkError } = await supabase
    .from('taggable_entities')
    .select('id, entity_id')
    .in('id', userEntityIds)
    .eq('entity_type', 'user');

  if (checkError) {
    console.error('Error checking user entities for notifications:', checkError);
    return; // Don't throw error for notifications, just log and continue
  }

  const validUserTags = userTags.filter(tag => 
    existingUserEntities?.some(e => e.id === tag.id)
  );

  if (validUserTags.length === 0) {
    console.log('No valid user tags for notifications');
    return;
  }

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

  // Create notifications for each valid tagged user
  for (const tag of validUserTags) {
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
      } else {
        console.log('Created notification for user:', tag.entity_id);
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
