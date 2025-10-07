import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useModalState } from '@/hooks/useModalDetector';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useModalContext } from '@/contexts/ModalContext';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import PostSubmissionHandler from './bottom-navigation/PostSubmissionHandler';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
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
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  // Handle keyboard visibility and visual viewport changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        // Use visual viewport API for accurate keyboard detection
        const { height: vpHeight } = window.visualViewport;
        const windowHeight = window.innerHeight;
        
        // Keyboard is considered visible if viewport is significantly smaller
        const heightDiff = windowHeight - vpHeight;
        setIsKeyboardVisible(heightDiff > 150);
      }
    };

    const handleResize = () => {
      // Fallback for browsers without visual viewport support  
      const heightDiff = window.screen.height - window.innerHeight;
      setIsKeyboardVisible(heightDiff > 150);
    };

    // Use visual viewport API when available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleVisualViewportChange);
      };
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      // Open composer in empty state using the same hook instance powering the modal
      openComposerWithFiles([]);
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
            style={{
              // Force stable bottom positioning - prevents movement during swipes/scrolls
              position: 'fixed',
              bottom: '0px',
              left: '0px',
              right: '0px',
              // Prevent iOS Safari viewport issues
              paddingBottom: 'env(safe-area-inset-bottom)',
              // Ensure it stays at viewport bottom with fixed positioning
              zIndex: 100,
              // Prevent any movement or translation
              transform: 'none',
              touchAction: 'none',
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

      {/* Post Submission Handler */}
      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={closeComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        onAddFiles={openComposerWithFiles}
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