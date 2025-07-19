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

      // Validate media files
      if (mediaFiles.length === 0) {
        console.error('No media files provided for post submission');
        toast({
          title: "Upload Error",
          description: "Please select at least one photo or video",
          variant: "destructive"
        });
        onError?.();
        return;
      }

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

      // Handle post tags
      if (selectedTags && selectedTags.length > 0) {
        console.log('Creating post tags:', selectedTags);
        
        const tagsWithPostId = selectedTags.map(tag => ({
          post_id: postData.id,
          tagged_entity_id: tag.id,
          start_index: 0, // You can update this later to handle actual text positions
          end_index: 0
        }));

        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(tagsWithPostId);

        if (tagsError) {
          console.error('Error creating post tags:', tagsError);
        } else {
          console.log('Post tags created successfully');
        }
      }

      // Store course info temporarily in post content until we have proper tables
      if (courseInfo) {
        console.log('Adding course info to post content:', courseInfo);
        const updatedContent = `${content || ''}\n\n📍 Played at ${courseInfo.name}, ${courseInfo.country}`.trim();
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ content: updatedContent })
          .eq('id', postData.id);
          
        if (updateError) {
          console.error('Error updating post with course info:', updateError);
        }
      }

      // Start background upload for media files (don't wait for it)
      if (mediaFiles.length > 0) {
        console.log('Starting background upload for', mediaFiles.length, 'files');
        try {
          await startBackgroundUpload({
            postId: postData.id,
            mediaFiles,
            userId: user.id
          });
        } catch (uploadError) {
          console.error('Background upload failed:', uploadError);
          // Don't fail the whole post submission for upload errors
        }
      } else {
        console.warn('No media files to upload');
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