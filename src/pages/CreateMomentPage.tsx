import { useNavigate, useLocation } from 'react-router-dom';
import { useSnapModal } from '@/hooks/useSnapModal';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import { toast } from 'sonner';

/**
 * CreateMomentPage - Full-screen page for creating posts
 * Converted from modal to page, maintains exact same styling/behavior
 */
export default function CreateMomentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    isComposerOpen,
    mediaItems,
    setMediaItems,
    selectedFile,
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

  const handleShowToast = (message: string) => {
    toast(message);
  };

  const handleMediaChange = (items: any[]) => {
    setMediaItems(items);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop - same as Hub */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Glass Sheet - same as Hub */}
      <div 
        className="fixed inset-0 !rounded-none"
        style={{
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.16)',
        }}
      >
        <PostSubmissionHandler
          isComposerOpen={true} // Always open when page is mounted
          mediaItems={mediaItems}
          selectedFile={selectedFile}
          selectedCourse={selectedCourse}
          onCourseSelect={setSelectedCourse}
          onClose={handleClose}
          onShowToast={handleShowToast}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          onMediaChange={handleMediaChange}
        />
      </div>
    </div>
  );
}
