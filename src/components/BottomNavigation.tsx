
import React from 'react';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useModalState } from '@/hooks/useModalDetector';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';


interface BottomNavigationProps {
  variant?: 'default' | 'clubhouse';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ variant = 'default' }) => {
  const { activeTab, handleTabClick } = useNavigationHandlers();
  const isDesktop = useIsDesktop();
  
  // Composer state management
  const {
    captionInputRef,
    isComposerOpen,
    mediaItems,
    setMediaItems,
    selectedFile,
    caption,
    setCaption,
    isSubmitting,
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openComposer,
    openComposerWithFiles,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  // Register modal states with the modal detector
  useModalState(isComposerOpen);

  // State for tags handled in CreateMomentModal
  const [localSelectedTags, setLocalSelectedTags] = React.useState<any[]>([]);

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      // Navigate to create moment page
      handleTabClick({ id: 'post', path: '/create-moment', isAction: false });
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

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />
    </>
  );
};

export default BottomNavigation;
