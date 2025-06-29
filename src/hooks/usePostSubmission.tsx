
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
    if (!validatePostSubmission(user, content, mediaFiles)) {
      onError();
      return;
    }

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
    
    // Start upload process
    let createdPostId: string | null = null;
    
    try {
      console.log('Starting post creation...', { content, mediaCount: mediaFiles.length });
      
      // Create the post first
      const postData = await createPost(user.id, content);
      createdPostId = postData.id;
      console.log('Post created with ID:', createdPostId);

      // Upload media files if any
      if (mediaFiles.length > 0) {
        // Show progress for videos
        if (hasVideoFiles) {
          showVideoProcessingProgress();
        }
        
        console.log('Starting media upload for', mediaFiles.length, 'files');
        await uploadMediaFiles(
          mediaFiles, 
          postData.id, 
          user.id,
          (file, error) => {
            console.error('File upload error:', file.name, error);
            showFileUploadError(file, error, postData.id, user.id);
          }
        );
        console.log('Media upload completed');
      }

      // Handle post tags
      if (selectedTags.length > 0) {
        console.log('Creating post tags for', selectedTags.length, 'tags');
        await handlePostTags(postData.id, selectedTags, user.id);
        console.log('Post tags created');
      }

      console.log('Upload process completed successfully');

      // Show success message
      showSuccessMessage();

      // Broadcast success events for feed refresh
      broadcastPostSuccess(postData.id, optimisticPost.id);
      
      // Trigger feed refresh events
      window.dispatchEvent(new CustomEvent('refreshFeed'));
      window.dispatchEvent(new CustomEvent('postUploadCompleted'));

      // Call onSuccess callback
      onSuccess();

    } catch (error) {
      console.error('Error in post submission:', error);
      
      // If we created a post but subsequent operations failed, roll it back
      if (createdPostId) {
        console.log('Rolling back post due to error:', createdPostId);
        await rollbackPost(createdPostId);
      }
      
      // Show retry option with specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showUploadFailedError(errorMessage, () => {
        console.log('Retrying post submission');
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
