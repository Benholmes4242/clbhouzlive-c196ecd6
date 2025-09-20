
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFileErrorMessage } from '@/components/posts/utils/fileValidation';
import { uploadMediaWithRetry } from '@/components/posts/utils/mediaUpload';

export const usePostNotifications = () => {
  const { toast } = useToast();

  const showValidationError = (error: string) => {
    toast({
      title: "Upload Error",
      description: error,
      variant: "destructive",
      duration: 5000
    });
  };

  const showVideoUploadProgress = () => {
    toast({
      title: "Uploading video...",
      description: "Your video is being processed. This may take a moment.",
      duration: 4000
    });
  };

  const showVideoProcessingProgress = () => {
    toast({
      title: "Processing video...",
      description: "Almost done! Your video is being uploaded.",
      duration: 3000
    });
  };

  const showFileUploadError = (file: File, error: any, postId: string, userId: string) => {
    toast({
      title: "Upload Error",
      description: getFileErrorMessage(file, error),
      variant: "destructive",
      duration: 8000,
      action: (
        <button
          onClick={() => {
            uploadMediaWithRetry(file, postId, userId).catch(console.error);
          }}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
        >
          Retry
        </button>
      )
    });
  };

  const showUploadFailedError = (errorMessage: string, retryFn: () => void) => {
    toast({
      title: "Upload failed",
      description: `${errorMessage}. Tap to retry uploading your post.`,
      variant: "destructive",
      duration: 8000,
      action: (
        <button
          onClick={retryFn}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
        >
          Retry
        </button>
      )
    });
  };

  const showSuccessMessage = () => {
    // Success is now handled by SuccessOverlay component
    return { success: true };
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
