import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBackgroundUpload } from './useBackgroundUpload';
import { validateFiles } from '@/components/posts/utils/fileValidation';

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

export const useOptimisticPostSubmission = () => {
  const { toast } = useToast();
  const { startBackgroundUpload } = useBackgroundUpload();
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
      // Quick validation (no size limits, just format check)
      const validation = validateFiles(mediaFiles);
      if (!validation.isValid) {
        toast({
          title: "Upload Error",
          description: validation.error,
          variant: "destructive"
        });
        onError?.();
        return;
      }

      console.log('Creating optimistic post with data:', {
        userId: user.id,
        content,
        mediaFilesCount: mediaFiles.length,
        tagsCount: selectedTags.length,
        courseInfo,
        fileDetails: mediaFiles.map(f => ({ 
          name: f.name, 
          size: `${(f.size / 1024 / 1024).toFixed(2)}MB`, 
          type: f.type 
        }))
      });

      // Create the post immediately
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content || null
        })
        .select()
        .single();

      if (postError) throw postError;

      console.log('Post created successfully:', postData);

      // Create tags immediately (they're small and fast)
      await Promise.all([
        // Create user tags
        ...selectedTags.map(async (tag) => {
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
        }),

        // Create golf course tag if needed
        ...(courseInfo ? [(async () => {
          try {
            let golfCourseEntityId = null;
            
            // Check if golf course entity exists
            const { data: existingEntity } = await supabase
              .from('taggable_entities')
              .select('id')
              .eq('entity_type', 'golf_club')
              .eq('entity_id', courseInfo.id)
              .single();

            if (existingEntity) {
              golfCourseEntityId = existingEntity.id;
            } else {
              // Create the taggable entity
              const { data: newEntity, error: entityError } = await supabase
                .from('taggable_entities')
                .insert({
                  entity_type: 'golf_club',
                  entity_id: courseInfo.id,
                  name: courseInfo.name,
                  username: null
                })
                .select('id')
                .single();

              if (entityError) throw entityError;
              golfCourseEntityId = newEntity.id;
            }

            // Create the post tag
            if (golfCourseEntityId) {
              const { error: courseTagError } = await supabase
                .from('post_tags')
                .insert({
                  post_id: postData.id,
                  tagged_by_user_id: user.id,
                  tagged_entity_id: golfCourseEntityId
                });

              if (courseTagError) {
                console.error('Error creating golf course tag:', courseTagError);
              }
            }
          } catch (error) {
            console.error('Error handling golf course tag:', error);
          }
        })()] : [])
      ]);

      // Start background upload for media files (don't wait for it)
      if (mediaFiles.length > 0) {
        startBackgroundUpload({
          postId: postData.id,
          mediaFiles,
          userId: user.id
        });
      }

      // Dispatch success event immediately
      window.dispatchEvent(new CustomEvent('postCompleted', {
        detail: { 
          optimisticId: null,
          realPost: postData 
        }
      }));

      // Call success immediately
      onSuccess?.();
      
    } catch (error) {
      console.error('Error submitting post:', error);
      onError?.();
      
      let errorMessage = "Failed to create post. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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