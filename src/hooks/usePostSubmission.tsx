import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateFiles, getFileErrorMessage } from '@/components/posts/utils/fileValidation';
import { uploadMediaWithRetry } from '@/components/posts/utils/mediaUpload';
import { createPostTags, rollbackPost, createTagNotifications } from '@/components/posts/utils/postOperations';
import { createOptimisticPost } from '@/components/posts/utils/optimisticPost';
import { showToast } from '@/utils/toast';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostSubmissionParams {
  user: any;
  content: string;
  mediaFiles: File[];
  selectedTags: TaggableEntity[];
  onSuccess: () => void;
  onError: () => void;
}

export const usePostSubmission = () => {
  const { toast } = useToast();

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    selectedTags,
    onSuccess,
    onError
  }: PostSubmissionParams) => {
    if (!user || (!content.trim() && mediaFiles.length === 0)) return;

    // Validate files before proceeding
    const validationResult = validateFiles(mediaFiles);
    if (!validationResult.isValid) {
      toast({
        title: "Upload Error",
        description: validationResult.error,
        variant: "destructive",
        duration: 5000
      });
      onError();
      return;
    }

    // Check if we have videos to show appropriate feedback
    const hasVideos = mediaFiles.some(file => file.type.startsWith('video/'));
    
    // Show immediate upload feedback for videos
    if (hasVideos) {
      toast({
        title: "Uploading video...",
        description: "Your video is being processed. This may take a moment.",
        duration: 4000
      });
    }

    // Create optimistic post for immediate UI update
    const optimisticPost = createOptimisticPost(user, content, mediaFiles, selectedTags);
    
    // For videos, don't redirect immediately - wait for upload to complete
    if (!hasVideos) {
      onSuccess(); // Only call onSuccess immediately for non-video posts
    }

    // Start upload process
    let createdPostId: string | null = null;
    
    try {
      console.log('Starting post creation...');
      
      // Create the post first
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim() || null
        })
        .select()
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        throw new Error('Failed to create post');
      }

      console.log('Post created successfully:', postData.id);
      createdPostId = postData.id;

      // Upload media files if any
      if (mediaFiles.length > 0) {
        console.log('Uploading media files...');
        
        // Show progress for videos
        if (hasVideos) {
          toast({
            title: "Processing video...",
            description: "Almost done! Your video is being uploaded.",
            duration: 3000
          });
        }
        
        // Upload each file with retry logic
        for (const file of mediaFiles) {
          try {
            await uploadMediaWithRetry(file, postData.id, user.id);
          } catch (error) {
            console.error(`Failed to upload ${file.name} after retries:`, error);
            
            // Show specific error for this file
            toast({
              title: "Upload Error",
              description: getFileErrorMessage(file, error),
              variant: "destructive",
              duration: 8000,
              action: (
                <button
                  onClick={() => {
                    // Retry just this file
                    uploadMediaWithRetry(file, postData.id, user.id).catch(console.error);
                  }}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
                >
                  Retry
                </button>
              )
            });
            
            // Don't fail completely for videos - continue with other files
            if (hasVideos) {
              continue;
            } else {
              throw error; // For non-videos, fail as before
            }
          }
        }
        
        console.log('Media upload completed');
      }

      // Create post tags if any
      if (selectedTags.length > 0) {
        console.log('Creating post tags...');
        await createPostTags(postData.id, selectedTags, user.id);
        console.log('Post tags created');

        // Create notifications for tagged users
        console.log('Creating tag notifications...');
        await createTagNotifications(postData.id, selectedTags, user.id);
        console.log('Tag notifications created');
      }

      console.log('Upload process completed successfully');

      // Show single success message for all posts
      showToast("Your Post Is Out There");

      // Now call onSuccess for videos after successful upload
      if (hasVideos) {
        onSuccess();
      }

      // Broadcast success event for feed refresh
      window.dispatchEvent(new CustomEvent('postUploadCompleted', { 
        detail: { postId: postData.id, optimisticId: optimisticPost.id } 
      }));

      // Also broadcast a general feed refresh event
      window.dispatchEvent(new CustomEvent('refreshFeed'));

    } catch (error) {
      console.error('Error in upload:', error);
      
      // If we created a post but subsequent operations failed, roll it back
      if (createdPostId) {
        await rollbackPost(createdPostId);
      }
      
      // Show retry option with specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Upload failed",
        description: `${errorMessage}. Tap to retry uploading your post.`,
        variant: "destructive",
        duration: 8000,
        action: (
          <button
            onClick={() => {
              // Retry the upload
              submitPost({ user, content, mediaFiles, selectedTags, onSuccess: () => {}, onError });
            }}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
          >
            Retry
          </button>
        )
      });

      // Broadcast error event for UI cleanup
      window.dispatchEvent(new CustomEvent('postUploadFailed', { 
        detail: { optimisticId: optimisticPost.id } 
      }));

      // Call onError to prevent redirect for failed uploads
      onError();
    }
  };

  return { submitPost };
};
