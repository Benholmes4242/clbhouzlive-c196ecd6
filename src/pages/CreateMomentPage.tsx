import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import EnhancedCreateMomentModal from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { updateRecentMediaFromItems } from '@/hooks/usePostSubmission/recentMediaListener';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useChromeState } from '@/hooks/useChromeState';
import AccessControl from '@/components/AccessControl';

export default function CreateMomentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { submitPost } = useOptimisticPostSubmission();
  const { addOptimisticPost } = useOptimisticPostInsertion();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get state from navigation (media items, course, etc.)
  const state = location.state as any;
  const mediaItems = state?.mediaItems || [];
  const selectedCourse = state?.selectedCourse;

  // Force hide chrome (header, footer, HUD) while this page is open
  useChromeState({ forceHidden: true });

  const handleClose = () => {
    // Navigate back to previous location or clubhouse
    const backgroundLocation = (location.state as any)?.backgroundLocation;
    if (backgroundLocation) {
      navigate(backgroundLocation.pathname + backgroundLocation.search, { replace: true });
    } else {
      navigate('/clubhouse', { replace: true });
    }
  };

  const handleSubmit = async (data: any) => {
    // Derive files from mediaItems only (single source of truth)
    const files = mediaItems.map((item: ComposerMediaItem) => item.file);
    
    // Strict validation: no media, no post
    if (files.length === 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      // Add optimistic post immediately for better UX
      if (user) {
        addOptimisticPost({
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

      // Update recent media cache
      if (mediaItems.length > 0) {
        await updateRecentMediaFromItems(mediaItems);
      }

      // Background upload
      submitPost({
        user,
        content: data.caption,
        mediaFiles: files,
        mediaItems,
        selectedTags: data.tags ?? [],
        courseInfo: data.selectedCourse ?? data.course,
        studioEditsByMediaId: data.studioEditsByMediaId ?? {},
        onSuccess: () => {
          console.log('Post submission successful - background upload completed');
          setIsSubmitting(false);
          
          // Dispatch post completion event
          window.dispatchEvent(new CustomEvent('postCompleted', {
            detail: { mediaItems }
          }));
          
          // Navigate back after successful submission
          handleClose();
        },
        onError: () => {
          console.error('Post submission failed - background upload failed');
          setIsSubmitting(false);
        }
      }).catch((error) => {
        console.error('Error in enhanced post submission:', error);
        setIsSubmitting(false);
      });
      
    } catch (error) {
      console.error('Error submitting post:', error);
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (items: ComposerMediaItem[]) => {
    // Update location state with new media items
    navigate(location.pathname, {
      state: { ...state, mediaItems: items },
      replace: true,
    });
  };

  const handleCourseSelect = (course: any) => {
    // Update location state with selected course
    navigate(location.pathname, {
      state: { ...state, selectedCourse: course },
      replace: true,
    });
  };

  return (
    <AccessControl requireAuth={true}>
      <EnhancedCreateMomentModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        mediaItems={mediaItems}
        selectedCourse={selectedCourse}
        onCourseSelect={handleCourseSelect}
        onMediaChange={handleMediaChange}
      />
    </AccessControl>
  );
}
