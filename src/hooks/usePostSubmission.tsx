
import { validateFiles } from '@/components/posts/utils/fileValidation';
import { rollbackPost } from '@/components/posts/utils/postOperations';
import { createOptimisticPost } from '@/components/posts/utils/optimisticPost';
import { PostSubmissionParams } from './usePostSubmission/types';
import { validatePostSubmission, hasVideos } from './usePostSubmission/validation';
import { createPost, uploadMediaFiles, handlePostTags } from './usePostSubmission/uploadUtils';
import { usePostNotifications } from './usePostSubmission/notifications';
import { broadcastPostSuccess, broadcastPostError } from './usePostSubmission/events';

export const usePostSubmission = () => {
  const {
    showValidationError,
    showVideoUploadProgress,
    showVideoProcessingProgress,
    showFileUploadError,
    showUploadFailedError,
    showSuccessMessage
  } = usePostNotifications();

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    selectedTags,
    onSuccess,
    onError
  }: PostSubmissionParams) => {
    if (!validatePostSubmission(user, content, mediaFiles)) return;

    // Validate files before proceeding
    const validationResult = validateFiles(mediaFiles);
    if (!validationResult.isValid) {
      showValidationError(validationResult.error!);
      onError();
      return;
    }

    // Check if we have videos to show appropriate feedback
    const hasVideoFiles = hasVideos(mediaFiles);
    
    // Show immediate upload feedback for videos
    if (hasVideoFiles) {
      showVideoUploadProgress();
    }

    // Create optimistic post for immediate UI update
    const optimisticPost = createOptimisticPost(user, content, mediaFiles, selectedTags);
    
    // For videos, don't redirect immediately - wait for upload to complete
    if (!hasVideoFiles) {
      onSuccess(); // Only call onSuccess immediately for non-video posts
    }

    // Start upload process
    let createdPostId: string | null = null;
    
    try {
      console.log('Starting post creation...');
      
      // Create the post first
      const postData = await createPost(user.id, content);
      createdPostId = postData.id;

      // Upload media files if any
      if (mediaFiles.length > 0) {
        // Show progress for videos
        if (hasVideoFiles) {
          showVideoProcessingProgress();
        }
        
        await uploadMediaFiles(
          mediaFiles, 
          postData.id, 
          user.id,
          (file, error) => {
            showFileUploadError(file, error, postData.id, user.id);
          }
        );
      }

      // Handle post tags
      await handlePostTags(postData.id, selectedTags, user.id);

      console.log('Upload process completed successfully');

      // Show single success message for all posts
      showSuccessMessage();

      // Now call onSuccess for videos after successful upload
      if (hasVideoFiles) {
        onSuccess();
      }

      // Broadcast success events
      broadcastPostSuccess(postData.id, optimisticPost.id);

    } catch (error) {
      console.error('Error in upload:', error);
      
      // If we created a post but subsequent operations failed, roll it back
      if (createdPostId) {
        await rollbackPost(createdPostId);
      }
      
      // Show retry option with specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showUploadFailedError(errorMessage, () => {
        submitPost({ user, content, mediaFiles, selectedTags, onSuccess: () => {}, onError });
      });

      // Broadcast error event for UI cleanup
      broadcastPostError(optimisticPost.id);

      // Call onError to prevent redirect for failed uploads
      onError();
    }
  };

  return { submitPost };
};
