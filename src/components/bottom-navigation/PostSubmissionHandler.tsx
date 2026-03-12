import React from 'react';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import EnhancedCreateMomentModal from '@/components/post/EnhancedCreateMomentModal.cinematic';

interface PostSubmissionHandlerProps {
  isComposerOpen: boolean;
  mediaItems: ComposerMediaItem[]; // Single source of truth for media
  selectedFile: File | null; // Deprecated: kept for backward compatibility but not used in composer flow
  selectedCourse: any;
  onCourseSelect: (course: any) => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
  // Legacy props - kept for backwards compatibility but no longer used
  isSubmitting?: boolean;
  setIsSubmitting?: (submitting: boolean) => void;
  onMediaChange?: (items: ComposerMediaItem[]) => void;
}

/**
 * PostSubmissionHandler - Thin wrapper around EnhancedCreateMomentModal
 * 
 * The modal now handles submission internally via enqueuePostUploadWithResilience.
 * This component is kept for backwards compatibility with existing consumers.
 */
const PostSubmissionHandler: React.FC<PostSubmissionHandlerProps> = ({
  isComposerOpen,
  mediaItems,
  selectedCourse,
  onCourseSelect,
  onClose,
  onMediaChange
}) => {
  return (
    <EnhancedCreateMomentModal
      isOpen={isComposerOpen}
      onClose={onClose}
      mediaItems={mediaItems}
      selectedCourse={selectedCourse}
      onCourseSelect={onCourseSelect}
      onMediaChange={onMediaChange}
    />
  );
};

export default PostSubmissionHandler;
