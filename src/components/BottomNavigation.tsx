
import React from 'react';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import SnapModal from '@/components/snap/SnapModal';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import PostSubmissionHandler from './bottom-navigation/PostSubmissionHandler';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';

interface BottomNavigationProps {
  variant?: 'default' | 'clubhouse';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ variant = 'default' }) => {
  const { activeTab, handleTabClick } = useNavigationHandlers();
  const isDesktop = useIsDesktop();
  
  // Snap modal state management
  const {
    captionInputRef,
    isSnapModalOpen,
    isComposerOpen,
    selectedFile,
    caption,
    setCaption,
    isSubmitting,
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openSnapModal,
    closeSnapModal,
    openComposer,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  // State for tags handled in CreateMomentModal
  const [localSelectedTags, setLocalSelectedTags] = React.useState<any[]>([]);

  // Media handlers for camera, image, and video
  const { handleCameraClick, handleImageClick, handleVideoClick } = useMediaHandlers(closeSnapModal, openComposer);

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      // Handle camera action
      openSnapModal();
    } else {
      // Handle regular navigation
      handleTabClick(tab);
    }
  };

  return (
    <>
      <NavigationBar
        activeTab={activeTab}
        onTabClick={handleTabClickWithCamera}
        variant={variant}
      />

      {/* Cinematic Snap Modal */}
      <SnapModal
        isOpen={isSnapModalOpen}
        onClose={closeSnapModal}
        onCameraClick={() => handleCameraClick({})}
        onImageClick={() => handleImageClick({})}
        onVideoClick={() => handleVideoClick({})}
      />

      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        selectedFiles={[]}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={handleCloseComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={() => {}}
      />

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />
    </>
  );
};

export default BottomNavigation;
