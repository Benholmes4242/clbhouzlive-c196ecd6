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
      // 1. Update post content
      const { error: postError } = await supabase
        .from('posts')
        .update({
          content: data.caption,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (postError) throw postError;

      // 2. Handle media updates
      if (data.files.length > 0) {
        // Upload new media files
        const mediaUploads = await Promise.all(
          data.files.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${postId}_${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('post-media')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('post-media')
              .getPublicUrl(fileName);

            return {
              post_id: postId,
              media_url: publicUrl,
              media_type: file.type.startsWith('image/') ? 'image' : 'video'
            };
          })
        );

        // Insert new media records
        if (mediaUploads.length > 0) {
          const { error: mediaError } = await supabase
            .from('post_media')
            .insert(mediaUploads);

          if (mediaError) throw mediaError;
        }
      }

      // 3. Update post tags (mentions)
      // First, remove existing tags
      const { error: deleteTagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      if (deleteTagsError) throw deleteTagsError;

      // Insert new tags
      if (data.tags.length > 0) {
        const user = await supabase.auth.getUser();
        const tagInserts = data.tags.map(tag => ({
          post_id: postId,
          tagged_entity_id: tag.id,
          tagged_by_user_id: user.data.user?.id
        }));

        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      // 4. Handle course tagging
      if (data.course) {
        // Find or create course entity in taggable_entities
        let courseEntity = await supabase
          .from('taggable_entities')
          .select('id')
          .eq('entity_type', 'golf_club')
          .eq('name', data.course.name)
          .maybeSingle();

        if (!courseEntity.data) {
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

          if (entityError) throw entityError;
          courseEntity.data = newEntity;
        }

        // Add course tag
        const user = await supabase.auth.getUser();
        const { error: courseTagError } = await supabase
          .from('post_tags')
          .insert({
            post_id: postId,
            tagged_entity_id: courseEntity.data.id,
            tagged_by_user_id: user.data.user?.id
          });

        if (courseTagError) throw courseTagError;
      }

      toast({
        title: "Success!",
        description: "Your updates have been saved!",
        className: "bg-green-600 text-white border-green-600",
        duration: 3000,
      });

      return { success: true };

    } catch (error) {
      console.error('Error updating post:', error);
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