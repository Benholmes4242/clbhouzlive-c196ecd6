
import React from 'react';
import { toast } from 'sonner';
import { getFileErrorMessage } from '@/components/posts/utils/fileValidation';
import { uploadMediaWithRetry } from '@/components/posts/utils/mediaUpload';
import { showToast } from '@/utils/toast';

export const usePostNotifications = () => {

  const showValidationError = (error: string) => {
    toast.error(error, { duration: 5000 });
  };

  const showVideoUploadProgress = () => {
    toast("Uploading video...", {
      description: "Your video is being processed. This may take a moment.",
      duration: 4000
    });
  };

  const showVideoProcessingProgress = () => {
    toast("Processing video...", {
      description: "Almost done! Your video is being uploaded.",
      duration: 3000
    });
  };

  const showFileUploadError = (file: File, error: any, postId: string, userId: string) => {
    toast.error(getFileErrorMessage(file, error), {
      duration: 8000,
      action: {
        label: "Retry",
        onClick: () => {
          uploadMediaWithRetry(file, postId, userId).catch(console.error);
        }
      }
    });
  };

  const showUploadFailedError = (errorMessage: string, retryFn: () => void) => {
    toast.error(`${errorMessage}. Tap to retry uploading your post.`, {
      duration: 8000,
      action: {
        label: "Retry",
        onClick: retryFn
      }
    });
  };

  const showSuccessMessage = () => {
    showToast("Your Post Is Out There");
  };

  return {
    showValidationError,
    showVideoUploadProgress,
    showVideoProcessingProgress,
    showFileUploadError,
    showUploadFailedError,
    showSuccessMessage
  };
};
