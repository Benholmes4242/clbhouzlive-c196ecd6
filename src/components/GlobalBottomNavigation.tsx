import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useModalState } from '@/hooks/useModalDetector';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useModalContext } from '@/contexts/ModalContext';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useClubhouseStore } from '@/store/clubhouseStore';

// Note: usePrefetch is accessed via useAppPrefetch to avoid static/dynamic import conflict
import { useAppPrefetch } from '@/hooks/useAppPrefetch';
import NavigationBar from './bottom-navigation/NavigationBar';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';

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
  '/admin-v2', // Admin console — uses its own sidebar/header chrome
  '/verified', // Verified page - standalone, no app chrome
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
  const openPostStudio = usePostStudioStore((s) => s.openPostStudio);
  
  
  const navRef = useRef<HTMLDivElement>(null);
  
  // Prefetch routes on hover/touch for faster navigation
  const handleNavPrefetch = useCallback((path: string) => {
    triggerPrefetch(path);
    handlePrefetch(path);
  }, [triggerPrefetch, handlePrefetch]);
  
  // Check if drawer is active (for clubhouse mini profile or comments)
  const [isDrawerActive, setIsDrawerActive] = useState(false);
  
  useEffect(() => {
    const checkDrawer = () => {
      setIsDrawerActive(document.body.classList.contains('drawer-active'));
    };
    
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
  
  const showNavigation = isVisible && !shouldHideForRoute;

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
    
    const interactiveElements = navRef.current.querySelectorAll('button, a, input');
    interactiveElements.forEach(el => {
      if (isHidden) {
        el.setAttribute('tabindex', '-1');
      } else {
        el.removeAttribute('tabindex');
      }
    });
  }, [chromeState]);

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      openPostStudio();
    } else if (tab.id === 'debug') {
      const current = localStorage.getItem('CLBHOUZ_VIDEO_DEBUG') === 'true';
      localStorage.setItem('CLBHOUZ_VIDEO_DEBUG', current ? 'false' : 'true');
      window.dispatchEvent(new CustomEvent('clbhouz-debug-toggle'));
    } else if (tab.id === 'clubhouse' && location.pathname === '/') {
      // Already on Home — scroll feed to top
      const feedContainer = document.querySelector('[data-snap-feed]');
      if (feedContainer) {
        feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
              "fixed! bottom-0! w-full max-w-[480px]",
              "left-1/2! -translate-x-1/2!",
              "z-[100]!",
              "m-0!"
            )}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
    </>
  );
};

export default GlobalBottomNavigation;
