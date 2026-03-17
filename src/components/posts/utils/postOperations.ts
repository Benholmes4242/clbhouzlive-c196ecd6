import { supabase } from '@/integrations/supabase/client';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  start_index?: number;
  end_index?: number;
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
    const uniqueTagEntityIds = [...new Set(selectedTags.map((tag) => tag.id).filter(Boolean))];

    const { data: existingEntities, error: entityCheckError } = await supabase
      .from('taggable_entities')
      .select('id')
      .in('id', uniqueTagEntityIds);

    if (entityCheckError) {
      console.error('Error validating taggable_entities:', entityCheckError);
      throw entityCheckError;
    }

    const validEntityIds = new Set((existingEntities || []).map((entity) => entity.id));

    const postTagsData = selectedTags
      .filter((tag) => validEntityIds.has(tag.id))
      .map((tag) => {
        const fallbackDisplayText = `@${tag.name}`;
        const fallbackStartIndex = caption.toLowerCase().indexOf(fallbackDisplayText.toLowerCase());

        const startIndex = typeof tag.start_index === 'number'
          ? tag.start_index
          : Math.max(0, fallbackStartIndex);

        const endIndex = typeof tag.end_index === 'number'
          ? tag.end_index
          : Math.max(startIndex + fallbackDisplayText.length, startIndex + 1);

        return {
          post_id: postId,
          tagged_entity_id: tag.id,
          tagged_by_user_id: userId,
          start_index: startIndex,
          end_index: endIndex,
        };
      });

    if (postTagsData.length === 0) {
      console.warn('No valid taggable_entities found; skipping post_tags insert');
      return;
    }

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
  const notifiableTags = selectedTags.filter(tag =>
    tag.entity_type === 'user' || tag.entity_type === 'business'
  );

  if (notifiableTags.length === 0) return;

  console.log('Creating tag notifications for:', notifiableTags);

  try {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', userId)
      .single();

    const userName = userProfile?.display_name || userProfile?.username || 'Someone';

    for (const tag of notifiableTags) {
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
  }
};

export const rollbackPost = async (postId: string): Promise<void> => {
  try {
    console.log('Rolling back post creation for:', postId);

    await supabase
      .from('post_media')
      .delete()
      .eq('post_id', postId);

    await supabase
      .from('post_tags')
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
