import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { updateRecentMediaFromItems } from '@/hooks/usePostSubmission/recentMediaListener';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import EnhancedCreateMomentModal from '@/components/post/EnhancedCreateMomentModal.cinematic';

interface PostSubmissionHandlerProps {
  isComposerOpen: boolean;
  mediaItems: ComposerMediaItem[];
  selectedFile: File | null; // Keep for backward compatibility
  selectedCourse: any;
  onCourseSelect: (course: any) => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

const PostSubmissionHandler: React.FC<PostSubmissionHandlerProps> = ({
  isComposerOpen,
  mediaItems,
  selectedFile,
  selectedCourse,
  onCourseSelect,
  onClose,
  onShowToast,
  isSubmitting,
  setIsSubmitting
}) => {
  const { user } = useSupabaseSession();
  const { submitPost } = useOptimisticPostSubmission();

  const handleSubmit = async (data: any) => {
    // Get files from mediaItems or fallback to selectedFile for backward compatibility
    const files = mediaItems.length > 0 
      ? mediaItems.map(item => item.file)
      : (selectedFile ? [selectedFile] : []);
    
    if (files.length === 0) {
      onShowToast('No media selected');
      return;
    }

    // Immediate UI feedback - close modal and show success toast
    onClose();
    onShowToast('Your post is out there!');
    
    // Update recent media cache immediately for instant thumbnail updates
    if (mediaItems.length > 0) {
      await updateRecentMediaFromItems(mediaItems);
    }
    
    // Background upload - don't await, don't block UI
    setIsSubmitting(true);
    
    // Dispatch post completion event with media items for cache update
    const dispatchPostCompleted = () => {
      window.dispatchEvent(new CustomEvent('postCompleted', {
        detail: { mediaItems }
      }));
    };
    
    submitPost({
      user,
      content: data.caption,
      mediaFiles: files,
      selectedTags: data.tags ?? [],
      courseInfo: data.selectedCourse ?? data.course,
      onSuccess: () => {
        console.log('Post submission successful - background upload completed');
        setIsSubmitting(false);
        dispatchPostCompleted();
      },
      onError: () => {
        console.error('Post submission failed - background upload failed');
        setIsSubmitting(false);
        onShowToast('Upload failed. Please try again later.');
      }
    }).catch((error) => {
      console.error('Error in enhanced post submission:', error);
      setIsSubmitting(false);
      onShowToast('Upload failed. Please try again later.');
    });
  };

  return (
    <EnhancedCreateMomentModal
      isOpen={isComposerOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      initialFiles={mediaItems.length > 0 ? mediaItems.map(item => item.file) : (selectedFile ? [selectedFile] : [])}
      selectedCourse={selectedCourse}
      onCourseSelect={onCourseSelect}
    />
  );
};

export default PostSubmissionHandler;