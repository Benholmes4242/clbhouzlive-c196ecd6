
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostSubmissionData {
  user: any;
  content: string;
  mediaFiles: File[];
  selectedTags: any[];
  courseInfo?: {
    id: string;
    name: string;
    country: string;
  } | null;
  onSuccess?: () => void;
  onError?: () => void;
}

export const usePostSubmission = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    selectedTags,
    courseInfo,
    onSuccess,
    onError
  }: PostSubmissionData) => {
    setIsSubmitting(true);

    try {
      console.log('Creating post with data:', {
        userId: user.id,
        content,
        mediaFilesCount: mediaFiles.length,
        tagsCount: selectedTags.length,
        courseInfo
      });

      // Create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content || null
        })
        .select()
        .single();

      if (postError) throw postError;

      console.log('Post created:', postData);

      // Upload media files
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          const fileExtension = file.name.split('.').pop();
          const fullFileName = `${fileName}.${fileExtension}`;
          
          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(`${user.id}/${fullFileName}`, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(`${user.id}/${fullFileName}`);

          // Create media record
          const { error: mediaError } = await supabase
            .from('post_media')
            .insert({
              post_id: postData.id,
              media_type: file.type.startsWith('image/') ? 'image' : 'video',
              media_url: publicUrl
            });

          if (mediaError) throw mediaError;
        }
      }

      // Create user tags
      for (const tag of selectedTags) {
        console.log('Creating tag:', tag);
        
        const { error: tagError } = await supabase
          .from('post_tags')
          .insert({
            post_id: postData.id,
            tagged_by_user_id: user.id,
            tagged_entity_id: tag.entity_id
          });

        if (tagError) {
          console.error('Error creating tag:', tagError);
        }
      }

      // Create golf course tag if course is selected
      if (courseInfo) {
        console.log('Creating golf course tag for:', courseInfo);
        
        const { error: courseTagError } = await supabase
          .from('post_tags')
          .insert({
            post_id: postData.id,
            tagged_by_user_id: user.id,
            tagged_entity_id: courseInfo.id
          });

        if (courseTagError) {
          console.error('Error creating golf course tag:', courseTagError);
        } else {
          console.log('Golf course tag created successfully');
        }
      }

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('postCompleted', {
        detail: { 
          optimisticId: null,
          realPost: postData 
        }
      }));

      onSuccess?.();
      
    } catch (error) {
      console.error('Error submitting post:', error);
      onError?.();
      
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitPost,
    isSubmitting
  };
};
