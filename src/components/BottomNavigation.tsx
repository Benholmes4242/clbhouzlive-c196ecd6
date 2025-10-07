
import React from 'react';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useModalState } from '@/hooks/useModalDetector';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import PostSubmissionHandler from './bottom-navigation/PostSubmissionHandler';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';

interface BottomNavigationProps {
  variant?: 'default' | 'clubhouse';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ variant = 'default' }) => {
  const { activeTab, handleTabClick } = useNavigationHandlers();
  
  const {
    openComposerWithFiles,
    showToast,
    toastMessage,
    hideToast
  } = useSnapModal();

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      // Open Create Moment modal directly with empty state
      openComposerWithFiles([]);
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

      <PostSubmissionHandler />

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />
    </>
  );
};

export default BottomNavigation;
