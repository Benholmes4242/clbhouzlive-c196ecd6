
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
  userId: string,
  caption: string = ''
): Promise<void> => {
  if (selectedTags.length === 0) return;

  console.log('Creating post tags for post:', postId, 'with tags:', selectedTags);

  try {
    // Calculate tag positions based on caption content (space-stripped to match composer format)
    const postTagsData = selectedTags.map(tag => {
      const displayText = `@${(tag.username || tag.name).replace(/\s+/g, '')}`;
      const startIndex = caption.toLowerCase().indexOf(displayText.toLowerCase());
      const endIndex = startIndex >= 0 ? startIndex + displayText.length : displayText.length;
      
      return {
        post_id: postId,
        tagged_entity_id: tag.id,
        start_index: Math.max(0, startIndex), // Ensure non-negative
        end_index: Math.max(displayText.length, endIndex) // Ensure valid length
      };
    });

    const { error } = await supabase
      .from('post_tags')
      .insert(postTagsData);

    if (error) {
      console.error('Error creating post tags:', error);
      throw error;
    }

    console.log('Post tags created successfully');
  } catch (error) {
    console.error('Error in createPostTags:', error);
    throw error;
  }
};

export const createTagNotifications = async (
  postId: string,
  selectedTags: TaggableEntity[],
  userId: string
): Promise<void> => {
  // Filter tags that need notifications (users + businesses)
  const notifiableTags = selectedTags.filter(tag => 
    tag.entity_type === 'user' || tag.entity_type === 'business'
  );
  
  if (notifiableTags.length === 0) return;

  console.log('Creating tag notifications for:', notifiableTags);

  try {
    // Get user's profile for notification content
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', userId)
      .single();

    const userName = userProfile?.display_name || userProfile?.username || 'Someone';

    // Create notifications for tagged entities
    for (const tag of notifiableTags) {
      // Don't notify the user if they tagged themselves
      if (tag.entity_id === userId) continue;

      if (tag.entity_type === 'user') {
        await supabase.rpc('send_push_notification', {
          target_user_id: tag.entity_id,
          notification_type: 'tag',
          title: 'Tagged in Post',
          message: `${userName} tagged you in their post`,
          data: {
            post_id: postId,
            tagger_id: userId,
            tagger_name: userName
          }
        });
      } else if (tag.entity_type === 'business') {
        // WARNING 5 FIX: Resolve business owner and notify them
        const { data: members } = await supabase
          .from('business_members')
          .select('user_profile_id')
          .eq('business_id', tag.entity_id)
          .eq('role', 'owner')
          .limit(1);

        const ownerId = members?.[0]?.user_profile_id;
        if (ownerId && ownerId !== userId) {
          await supabase.rpc('send_push_notification', {
            target_user_id: ownerId,
            notification_type: 'tag',
            title: 'Business Tagged',
            message: `${userName} tagged your business in their post`,
            data: {
              post_id: postId,
              tagger_id: userId,
              tagger_name: userName
            }
          });
        }
      }
    }

    console.log('Tag notifications created successfully');
  } catch (error) {
    console.error('Error creating tag notifications:', error);
    // Don't throw - notifications are not critical
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
