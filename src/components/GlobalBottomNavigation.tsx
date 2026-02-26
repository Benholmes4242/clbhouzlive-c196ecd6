import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useModalState } from '@/hooks/useModalDetector';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useModalContext } from '@/contexts/ModalContext';

// Note: usePrefetch is accessed via useAppPrefetch to avoid static/dynamic import conflict
import { useAppPrefetch } from '@/hooks/useAppPrefetch';
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
  '/admin-setup',
  '/onboarding',
  '/map',
];

// Route prefixes where bottom navigation should be hidden
const HIDDEN_ROUTE_PREFIXES = [
  '/echo', // Echo AI page - immersive full-screen experience
];

// Routes that use different nav styling (like clubhouse)
const CLUBHOUSE_ROUTES = [
  '/', 
  '/clubhouse'
];

// Routes that use the warm gradient Cleo design
const WARM_GRADIENT_ROUTES = [
  '/messages',
];

interface GlobalBottomNavigationProps {
  chromeState?: 'visible' | 'hidden';
}

const GlobalBottomNavigation: React.FC<GlobalBottomNavigationProps> = ({ chromeState = 'visible' }) => {
  const location = useLocation();
  const { isVisible, setNavRef } = useBottomNavigation();
  const { shouldHideHeader } = useModalContext();
  
  const { triggerPrefetch } = useAppPrefetch();
  const { activeTab, handleTabClick, handlePrefetch } = useNavigationHandlers();
  const isDesktop = useIsDesktop();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  
  // Prefetch routes on hover/touch for faster navigation
  // Calls both route prefetch AND hero video prefetch
  const handleNavPrefetch = useCallback((path: string) => {
    console.log('[GlobalBottomNavigation] handleNavPrefetch called:', path);
    triggerPrefetch(path);
    handlePrefetch(path); // Also trigger hero video prefetch
  }, [triggerPrefetch, handlePrefetch]);
  
  
  
  // Check if drawer is active (for clubhouse mini profile or comments)
  const [isDrawerActive, setIsDrawerActive] = useState(false);
  
  useEffect(() => {
    const checkDrawer = () => {
      setIsDrawerActive(document.body.classList.contains('drawer-active'));
    };
    
    // Check immediately and set up observer
    checkDrawer();
    const observer = new MutationObserver(checkDrawer);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  // Determine if current route should hide navigation
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname) ||
    HIDDEN_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix));
  const isClubhouseRoute = CLUBHOUSE_ROUTES.includes(location.pathname);
  const isWarmGradientRoute = WARM_GRADIENT_ROUTES.some(r => location.pathname.startsWith(r));
  
  // Final visibility state - chrome auto-hide system now handles ECM footer behavior
  const showNavigation = isVisible && !shouldHideForRoute;
  
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

  // Update accessibility when chrome state changes
  useEffect(() => {
    if (!navRef.current) return;
    
    const isHidden = chromeState === 'hidden';
    navRef.current.setAttribute('aria-hidden', isHidden.toString());
    
    // Update tab order
    const interactiveElements = navRef.current.querySelectorAll('button, a, input');
    interactiveElements.forEach(el => {
      if (isHidden) {
        el.setAttribute('tabindex', '-1');
      } else {
        el.removeAttribute('tabindex');
      }
    });
  }, [chromeState]);

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
            className={cn(
              "global-bottom-nav bottom-nav-fixed",
              "fixed! bottom-0! left-0! right-0! w-full",
              "z-[100]!",
              "m-0!" // Ensure no margins
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              transform: 'none', // Prevent Framer Motion from adding transforms that might cause floating
            }}
          >
            <div
              ref={(el) => {
                navRef.current = el;
                setNavRef(el);
              }}
              className="chrome-bottom-nav clubhouse-footer"
              data-chrome="bottom-nav"
              style={{
                background: isWarmGradientRoute
                    ? 'rgba(255,253,248,0.55)'
                    : isClubhouseRoute 
                      ? 'hsl(var(--clubhouse-bg-footer))'
                      : 'hsl(210 40% 98% / 0.95)',
                borderTop: isWarmGradientRoute
                    ? '1px solid rgba(255,255,255,0.3)'
                    : `0.5px solid ${isClubhouseRoute ? 'hsl(var(--clubhouse-border))' : 'hsl(215 25% 27% / 0.2)'}`,
                backdropFilter: isWarmGradientRoute ? 'blur(24px)' : 'blur(20px)',
                WebkitBackdropFilter: isWarmGradientRoute ? 'blur(24px)' : 'blur(20px)',
                paddingBottom: '30px',
                transition: 'all var(--motion-slow) cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <NavigationBar
                activeTab={activeTab}
                onTabClick={handleTabClickWithCamera}
                onPrefetch={handleNavPrefetch}
                variant={isClubhouseRoute ? 'clubhouse' : 'default'}
                isDimmed={false}
                useAmberActive={isWarmGradientRoute}
                showBorder={false}
              />
            </div>
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