import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface UpdatePostData {
  caption: string;
  files: File[];
  tags: TaggableEntity[];
  course?: {
    id: string;
    name: string;
    country: string;
    region?: string;
  } | null;
}

export const usePostUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updatePost = async (postId: string, data: UpdatePostData, existingMediaUrls: string[] = []) => {
    setIsUpdating(true);
    
    try {
      console.log('Starting post update for:', postId, data);

      // 1. Update post content
      const { error: postError } = await supabase
        .from('posts')
        .update({
          content: data.caption,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (postError) {
        console.error('Post update error:', postError);
        throw postError;
      }
      console.log('Post content updated successfully');

      // 2. Update post tags (mentions) - First remove existing tags
      const { error: deleteTagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      if (deleteTagsError) {
        console.error('Delete tags error:', deleteTagsError);
        throw deleteTagsError;
      }
      console.log('Existing tags deleted');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Insert new user tags
      if (data.tags.length > 0) {
        const tagInserts = data.tags.map(tag => ({
          post_id: postId,
          tagged_entity_id: tag.id,
          tagged_by_user_id: user.id
        }));

        console.log('Inserting tags:', tagInserts);
        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(tagInserts);

        if (tagsError) {
          console.error('Tags insert error:', tagsError);
          throw tagsError;
        }
        console.log('User tags inserted successfully');
      }

      // 3. Handle course tagging
      if (data.course) {
        console.log('Processing course tag:', data.course);
        
        // Find or create course entity in taggable_entities
        let { data: courseEntity, error: courseEntityError } = await supabase
          .from('taggable_entities')
          .select('id')
          .eq('entity_type', 'golf_club')
          .eq('entity_id', data.course.id)
          .maybeSingle();

        if (courseEntityError) {
          console.error('Course entity lookup error:', courseEntityError);
          throw courseEntityError;
        }

        if (!courseEntity) {
          console.log('Creating new course entity');
          // Create course entity
          const { data: newEntity, error: entityError } = await supabase
            .from('taggable_entities')
            .insert({
              entity_type: 'golf_club',
              entity_id: data.course.id,
              name: data.course.name,
              username: null
            })
            .select('id')
            .single();

          if (entityError) {
            console.error('Entity creation error:', entityError);
            throw entityError;
          }
          courseEntity = newEntity;
          console.log('Course entity created:', courseEntity);
        }

        // Add course tag
        const { error: courseTagError } = await supabase
          .from('post_tags')
          .insert({
            post_id: postId,
            tagged_entity_id: courseEntity.id,
            tagged_by_user_id: user.id
          });

        if (courseTagError) {
          console.error('Course tag error:', courseTagError);
          throw courseTagError;
        }
        console.log('Course tag added successfully');
      }

      console.log('All updates completed successfully');
      toast({
        title: "Success!",
        description: "Your updates have been saved!",
        className: "bg-green-600 text-white border-green-600",
        duration: 3000,
      });

      return { success: true };

    } catch (error) {
      console.error('Full error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to save updates. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      
      return { success: false, error };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updatePost,
    isUpdating
  };
};