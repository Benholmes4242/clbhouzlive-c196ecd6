import React, { useEffect, useState, useRef } from 'react';
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
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';
import { cn } from '@/lib/utils';
import { auditComponentMount, markPerformance } from '@/utils/clubhouseAudit';

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
  const navRef = useRef<HTMLDivElement>(null);
  
  // Determine if current route should hide navigation
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname);
  const isClubhouseRoute = CLUBHOUSE_ROUTES.includes(location.pathname);
  
  // Final visibility state - hide for routes, modals, or manual control
  const showNavigation = isVisible && !shouldHideForRoute && !shouldHideBottomNav;
  
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

  // Audit on mount
  useEffect(() => {
    if (isClubhouseRoute) {
      markPerformance('bottom-nav-mount-start');
      auditComponentMount(navRef.current, 'GlobalBottomNavigation', {
        checkLayers: true,
        checkA11y: true
      });
      markPerformance('bottom-nav-mount-end');
    }
  }, [isClubhouseRoute]);

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

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      // Open composer directly with empty state
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
            ref={navRef}
            className={cn(
              "global-bottom-nav bottom-nav-fixed",
              "fixed! bottom-0! left-0! right-0! w-full",
              "z-[100]!",
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              // Prevent iOS Safari viewport issues
              paddingBottom: 'env(safe-area-inset-bottom)',
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
        onClose={handleCloseComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={() => {}}
        onMediaChange={setMediaItems}
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