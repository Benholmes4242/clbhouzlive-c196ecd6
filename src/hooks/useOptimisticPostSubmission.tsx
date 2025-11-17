import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBackgroundUpload } from './useBackgroundUpload';
import { validateFiles } from '@/components/posts/utils/fileValidation';
import { handlePostTags } from './usePostSubmission/uploadUtils';

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
  achievementId?: string | null;
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
    achievementId,
    onSuccess,
    onError
  }: PostSubmissionData) => {
    setIsSubmitting(true);

    try {
      // CRITICAL: Media validation first (before any other checks)
      // No media, no post (except for achievement posts)
      if ((!mediaFiles || mediaFiles.length === 0) && !achievementId) {
        console.error('No media files provided for post submission');
        toast({
          title: "Upload Error",
          description: "Please select at least one photo or video",
          variant: "destructive"
        });
        onError?.();
        return;
      }

      // File format validation (no size limits, just format check)
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
        tagsCount: (selectedTags?.length ?? 0),
        courseInfo,
        fileDetails: mediaFiles.map(f => ({ 
          name: f.name, 
          size: `${(f.size / 1024 / 1024).toFixed(2)}MB`, 
          type: f.type 
        }))
      });

      // Create the post first
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content || null,
          achievement_id: achievementId || null
        })
        .select()
        .single();

      if (postError) throw postError;

      console.log('Post created successfully:', postData);

      let uploadSuccess = false;
      
      try {
        // Upload media files immediately (not in background) - required for post completion
        // Note: For non-achievement posts, mediaFiles.length > 0 is guaranteed by validation above
        if (mediaFiles.length > 0) {
          console.log('Uploading media files for post creation...');
          
          await startBackgroundUpload({
            postId: postData.id,
            mediaFiles,
            userId: user.id
          });
          
          console.log('Media upload completed successfully');
          uploadSuccess = true;
        } else {
          // This branch should only be reachable for achievement posts
          console.log('No media files to upload (achievement post)');
          uploadSuccess = true;
        }
      } catch (uploadError) {
        console.error('Media upload failed, rolling back post:', uploadError);
        
        // Delete the post since media upload failed
        try {
          await supabase
            .from('posts')
            .delete()
            .eq('id', postData.id);
          console.log('Post rolled back successfully');
        } catch (deleteError) {
          console.error('Failed to rollback post:', deleteError);
        }
        
        toast({
          title: "Upload Failed",
          description: "Failed to upload media files. Post not created.",
          variant: "destructive"
        });
        onError?.();
        return;
      }

      // Handle post tags with proper positions and notifications
      const tagCount = selectedTags?.length ?? 0;
      if (tagCount > 0) {
        try {
          await handlePostTags(postData.id, selectedTags, user.id, content || '');
          console.log('Post tags and notifications created successfully');
        } catch (tagError) {
          console.error('Error handling post tags:', tagError);
          // Don't fail the whole post submission for tag errors
        }
      }

      // Handle course info and create corresponding tag
      if (courseInfo) {
        console.log('Adding course info to post content:', courseInfo);
        
        // First, find the taggable entity for this course
        const { data: taggableEntity, error: entityError } = await supabase
          .from('taggable_entities')
          .select('id')
          .eq('entity_type', 'golf_club')
          .eq('entity_id', courseInfo.id)
          .single();
          
        if (taggableEntity && !entityError) {
          console.log('Found taggable entity for course:', taggableEntity);
          
          // Create a post tag for the course
          const { error: courseTagError } = await supabase
            .from('post_tags')
            .insert({
              post_id: postData.id,
              tagged_entity_id: taggableEntity.id,
              start_index: 0,
              end_index: 0
            });
            
          if (courseTagError) {
            console.error('Error creating course tag:', courseTagError);
          } else {
            console.log('Course tag created successfully for:', courseInfo.name);
          }
        } else {
          console.error('Could not find taggable entity for course:', courseInfo.id, entityError);
        }
        
        // Update post content with course info
        const updatedContent = `${content || ''}\n\n📍 Played at ${courseInfo.name}, ${courseInfo.country}`.trim();
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ content: updatedContent })
          .eq('id', postData.id);
          
        if (updateError) {
          console.error('Error updating post with course info:', updateError);
        }
      }

      // Upload is already complete - media files are uploaded before post creation
      console.log('Post created with uploaded media files');

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