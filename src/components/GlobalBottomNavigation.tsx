import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useModalState } from '@/hooks/useModalDetector';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useModalContext } from '@/contexts/ModalContext';
import SnapModal from '@/components/snap/SnapModal';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import PostSubmissionHandler from './bottom-navigation/PostSubmissionHandler';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';
import { cn } from '@/lib/utils';

// Routes where bottom navigation should be hidden
const HIDDEN_ROUTES = [
  '/auth',
  '/create-profile',
  '/admin-setup',
  // Add more full-screen routes as needed
];

// Routes that use different nav styling (like clubhouse)
const CLUBHOUSE_ROUTES = [
  '/', 
  '/clubhouse'
];

const GlobalBottomNavigation: React.FC = () => {
  const location = useLocation();
  const { isVisible } = useBottomNavigation();
  const { shouldHideBottomNav } = useModalContext();
  const { activeTab, handleTabClick } = useNavigationHandlers();
  const isDesktop = useIsDesktop();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Determine if current route should hide navigation
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname);
  const isClubhouseRoute = CLUBHOUSE_ROUTES.includes(location.pathname);
  
  // Final visibility state - hide for routes, modals, or manual control
  const showNavigation = isVisible && !shouldHideForRoute && !shouldHideBottomNav;
  
  // Snap modal state management
  const {
    captionInputRef,
    isSnapModalOpen,
    isComposerOpen,
    mediaItems,
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
    openComposerWithFiles,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  // Register modal states with the modal detector
  useModalState(isSnapModalOpen);
  useModalState(isComposerOpen);

  // State for tags handled in CreateMomentModal
  const [localSelectedTags, setLocalSelectedTags] = React.useState<any[]>([]);

  // Media handlers for camera, image, and video
  const { handleCameraClick, handleImageClick, handleVideoClick } = useMediaHandlers(closeSnapModal, openComposer);

  // Handle iOS visual viewport - adjust bottom position for toolbar show/hide
  useEffect(() => {
    if (!window.visualViewport) return;

    const el = document.querySelector<HTMLElement>('.global-bottom-nav');
    if (!el) return;

    const update = () => {
      const vv = window.visualViewport!;
      // Amount of space iOS is "stealing" at the bottom due to toolbars
      const offset = Math.max(window.innerHeight - (vv.height + vv.offsetTop), 0);
      el.style.setProperty('--vv-offset', `${Math.round(offset)}px`);
      
      // Also track keyboard visibility
      const heightDiff = window.innerHeight - vv.height;
      setIsKeyboardVisible(heightDiff > 150);
    };

    update();
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      openSnapModal();
    } else {
      handleTabClick(tab);
    }
  };

  return (
    <>
      {/* Global Fixed Bottom Navigation */}
      <AnimatePresence>
        {showNavigation && (
          <motion.div
            className={cn(
              "global-bottom-nav",
              "fixed bottom-0 left-0 right-0 w-full",
              "z-[100]",
              // Background extends to very bottom
              "backdrop-blur-md",
              isClubhouseRoute 
                ? "bg-black/60" 
                : "bg-background/95",
              // Top border/shadow for separation
              "before:absolute before:inset-x-0 before:top-0 before:h-px",
              isClubhouseRoute 
                ? "before:bg-white/10" 
                : "before:bg-border/50"
            )}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.25 
            }}
          >
            <NavigationBar
              activeTab={activeTab}
              onTabClick={handleTabClickWithCamera}
              variant={isClubhouseRoute ? 'clubhouse' : 'default'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snap Modal */}
      <SnapModal
        isOpen={isSnapModalOpen}
        onClose={closeSnapModal}
        onCameraClick={() => handleCameraClick({})}
        onImageClick={() => handleImageClick({})}
        onVideoClick={() => handleVideoClick({})}
        openComposerWithFiles={openComposerWithFiles}
      />

      {/* Post Submission Handler */}
      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={handleCloseComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={() => {}}
      />

      {/* Snap Toast */}
      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />
    </>
  );
};

export default GlobalBottomNavigation;