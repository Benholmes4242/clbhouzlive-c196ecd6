import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import EnhancedCreateMomentModal from '@/components/post/EnhancedCreateMomentModal.cinematic';

interface PostSubmissionHandlerProps {
  isComposerOpen: boolean;
  selectedFiles: File[];
  selectedFile: File | null;
  selectedCourse: any;
  onCourseSelect: (course: any) => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

const PostSubmissionHandler: React.FC<PostSubmissionHandlerProps> = ({
  isComposerOpen,
  selectedFiles,
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
    // Immediate UI feedback - close modal and show success toast
    onClose();
    onShowToast('Your post is out there!');
    
    // Background upload - don't await, don't block UI
    setIsSubmitting(true);
    submitPost({
      user,
      content: data.caption,
      mediaFiles: data.files,
      selectedTags: data.tags,
      courseInfo: data.course,
      onSuccess: () => {
        console.log('Post submission successful - background upload completed');
        setIsSubmitting(false);
        // Optionally show another toast when upload completes
        // onShowToast('Post is now live!');
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
      initialFiles={selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : [])}
      selectedCourse={selectedCourse}
      onCourseSelect={onCourseSelect}
    />
  );
};

export default PostSubmissionHandler;