import { useNavigate, useLocation } from 'react-router-dom';
import { useSnapModal } from '@/hooks/useSnapModal';
import { toast } from 'sonner';
import EnhancedCreateMomentModal from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { updateRecentMediaFromItems } from '@/hooks/usePostSubmission/recentMediaListener';

/**
 * CreateMomentPage - Full-screen page for creating posts
 * Converted from modal to page, maintains exact same styling/behavior
 */
export default function CreateMomentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { submitPost } = useOptimisticPostSubmission();
  const { addOptimisticPost } = useOptimisticPostInsertion();
  
  const {
    mediaItems,
    setMediaItems,
    selectedCourse,
    setSelectedCourse,
    isSubmitting,
    setIsSubmitting,
    closeComposer,
  } = useSnapModal();

  const handleClose = () => {
    closeComposer();
    // Navigate back to previous page
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (data: any) => {
    const files = mediaItems.map(item => item.file);
    
    if (files.length === 0 && !data.achievementId) {
      toast('No media selected');
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      // Add optimistic post
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

      // Navigate to discover
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
        mediaItems,
        selectedTags: data.tags ?? [],
        courseInfo: data.selectedCourse ?? data.course,
        studioEditsByMediaId: data.studioEditsByMediaId ?? {},
        onSuccess: () => {
          setIsSubmitting(false);
          window.dispatchEvent(new CustomEvent('postCompleted', {
            detail: { mediaItems }
          }));
        },
        onError: () => {
          setIsSubmitting(false);
          toast('Upload failed. Please try again later.');
        }
      }).catch(() => {
        setIsSubmitting(false);
        toast('Upload failed. Please try again later.');
      });
      
    } catch (error) {
      console.error('Error in post submission:', error);
      setIsSubmitting(false);
      toast('Upload failed. Please try again later.');
    }
  };

  return (
    <div className="fixed inset-0 z-[999]">
      <EnhancedCreateMomentModal
        theme="dark"
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        mediaItems={mediaItems}
        onMediaChange={setMediaItems}
        isSubmitting={isSubmitting}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
      />
    </div>
  );
}
