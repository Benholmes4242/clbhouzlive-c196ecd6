import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { updateRecentMediaFromItems } from '@/hooks/usePostSubmission/recentMediaListener';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import EnhancedCreateMomentModal from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { useNavigate, useLocation } from 'react-router-dom';

interface PostSubmissionHandlerProps {
  isComposerOpen: boolean;
  mediaItems: ComposerMediaItem[]; // Single source of truth for media
  selectedFile: File | null; // Deprecated: kept for backward compatibility but not used in composer flow
  selectedCourse: any;
  onCourseSelect: (course: any) => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  onMediaChange?: (items: ComposerMediaItem[]) => void;
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
  setIsSubmitting,
  onMediaChange
}) => {
  const { user } = useSupabaseSession();
  const { submitPost } = useOptimisticPostSubmission();
  const { addOptimisticPost } = useOptimisticPostInsertion();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (data: any) => {
    // Derive files from mediaItems only (single source of truth)
    const files = mediaItems.map(item => item.file);
    
    // Strict validation: no media, no post (except achievements)
    if (files.length === 0 && !data.achievementId) {
      onShowToast('No media selected');
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      // Add optimistic post immediately for better UX
      if (user) {
        const optimisticId = addOptimisticPost({
          caption: data.caption,
          files: files,
          selectedCourse: data.selectedCourse,
          visibility: data.visibility || 'public',
          coverIndex: data.coverIndex,
          userId: user.id,
          userProfile: {
            id: user.id,
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name,
            username: user.user_metadata?.username,
            profile_photo_url: user.user_metadata?.avatar_url
          }
        });
      }

      // Navigate to discover if not already there
      if (location.pathname !== '/discover') {
        navigate('/discover');
      }

      // Update recent media cache
      if (mediaItems.length > 0) {
        await updateRecentMediaFromItems(mediaItems);
      }

      // Background upload
      submitPost({
        user,
        content: data.caption,
        mediaFiles: files,
        selectedTags: data.tags ?? [],
        courseInfo: data.selectedCourse ?? data.course,
        onSuccess: () => {
          console.log('Post submission successful - background upload completed');
          setIsSubmitting(false);
          
          // Dispatch post completion event
          window.dispatchEvent(new CustomEvent('postCompleted', {
            detail: { mediaItems }
          }));
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
      
    } catch (error) {
      console.error('Error in enhanced post submission:', error);
      setIsSubmitting(false);
      onShowToast('Upload failed. Please try again later.');
    }
  };

  return (
    <EnhancedCreateMomentModal
      isOpen={isComposerOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      mediaItems={mediaItems}
      selectedCourse={selectedCourse}
      onCourseSelect={onCourseSelect}
      onMediaChange={onMediaChange}
    />
  );
};

export default PostSubmissionHandler;