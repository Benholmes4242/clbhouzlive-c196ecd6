
import React from 'react';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import PostSubmissionHandler from './bottom-navigation/PostSubmissionHandler';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';

interface BottomNavigationProps {
  variant?: 'default' | 'clubhouse';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ variant = 'default' }) => {
  const { activeTab, handleTabClick } = useNavigationHandlers();
  const isDesktop = useIsDesktop();
  
  // Composer state management
  const {
    isComposerOpen,
    mediaItems,
    selectedFile,
    selectedCourse,
    setSelectedCourse,
    openComposerWithFiles,
    closeComposer,
    isSubmitting,
    setIsSubmitting,
    showToast,
    toastMessage,
    hideToast
  } = useSnapModal();

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      // Open composer in empty state
      openComposerWithFiles([]);
    } else {
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

      <PostSubmissionHandler 
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={closeComposer}
        onShowToast={() => {}}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        onAddFiles={openComposerWithFiles}
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
