import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useModalState } from '@/hooks/useModalDetector';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useModalContext } from '@/contexts/ModalContext';
import { usePostStudioStore } from '@/stores/usePostStudioStore';


// Note: usePrefetch is accessed via useAppPrefetch to avoid static/dynamic import conflict
import { useAppPrefetch } from '@/hooks/useAppPrefetch';
import NavigationBar from './bottom-navigation/NavigationBar';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
import { useUnseenFriendReviews } from '@/hooks/useUnseenFriendReviews';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';

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
  const { unseenCount: unseenFriendReviews } = useUnseenFriendReviews();
  const { data: tournamentsCache } = useTournamentsCache();
  const liveTournamentCount = tournamentsCache?.live?.length ?? 0;
  const liveTabs = liveTournamentCount > 0 ? new Set(['tourhub']) : new Set<string>();
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
  const isOnboardingEditProfile =
    location.pathname === '/edit-profile' &&
    new URLSearchParams(location.search).get('onboarding') === '1';
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname) ||
    HIDDEN_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix)) ||
    isOnboardingEditProfile;
  const isClubhouseRoute = CLUBHOUSE_ROUTES.includes(location.pathname);
  const isWarmGradientRoute = WARM_GRADIENT_ROUTES.some(r => location.pathname.startsWith(r));
  const isTourHubRoute = location.pathname.startsWith('/tourhub');
  const isHandicapRoute = location.pathname.startsWith('/handicap');
  /** Routes that use dark chrome on the bottom nav (clubhouse feed + handicap only). */
  const isDarkChromeRoute = isClubhouseRoute || isHandicapRoute;
  
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
      openPostStudio({ returnPath: location.pathname });
    } else if (tab.id === 'debug') {
      const current = localStorage.getItem('CLBHOUZ_VIDEO_DEBUG') === 'true';
      localStorage.setItem('CLBHOUZ_VIDEO_DEBUG', current ? 'false' : 'true');
      window.dispatchEvent(new CustomEvent('clbhouz-debug-toggle'));
    } else if (tab.path && location.pathname === tab.path) {
      // Already on this tab's route — return to top.
      if (tab.id === 'clubhouse') {
        // Clubhouse scrolls an inner snap container, not the window.
        document.querySelector('[data-snap-feed]')
          ?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Let pages with sub-tabs also reset themselves.
      window.dispatchEvent(new CustomEvent('clbhouz-active-tab-retap', { detail: { tabId: tab.id } }));
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
              "fixed! bottom-0! w-full max-w-[480px] md:max-w-[600px] lg:max-w-[680px] xl:max-w-[760px]",
              "left-1/2! -translate-x-1/2!",
              "z-[100]!",
              "m-0!"
            )}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div
              ref={(el) => {
                navRef.current = el;
                setNavRef(el);
              }}
              className="chrome-bottom-nav clubhouse-footer"
              data-chrome="bottom-nav"
              style={{
                // Route-aware: dark on Clubhouse/Handicap, light everywhere else.
                background: isDarkChromeRoute ? '#0A0E14' : '#F8FAFC',
                borderTop: isDarkChromeRoute
                  ? '0.5px solid rgba(255,255,255,0.06)'
                  : '0.5px solid rgba(15,23,42,0.08)',
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
                transition: 'all var(--motion-slow) cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <NavigationBar
                activeTab={activeTab}
                onTabClick={handleTabClickWithCamera}
                onPrefetch={handleNavPrefetch}
                variant={isDarkChromeRoute ? 'clubhouse' : 'default'}
                isDimmed={false}
                useAmberActive={false}
                showBorder={false}
                tabBadges={{ courses: unseenFriendReviews }}
                liveTabs={liveTabs}
                isTourHubActive={isTourHubRoute}
              />

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalBottomNavigation;
