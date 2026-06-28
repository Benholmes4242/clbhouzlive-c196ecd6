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
import { isMedianApp } from '@/utils/median/isMedianApp';

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
  // On plain web, '/' renders BetaGatePage (coming-soon), not Clubhouse —
  // never paint the bottom nav over it. BUT: the Lovable preview host (and
  // ?preview=clbhouz bypass) renders ClubhouseWrapped at '/', so the nav must
  // still appear there.
  const isPreviewBypass = (() => {
    try {
      const h = window.location.hostname;
      const onPreviewHost = h.endsWith('.lovableproject.com') || h.endsWith('.lovable.app') || h.endsWith('.lovable.dev') || h === 'localhost' || h === '127.0.0.1';
      if (onPreviewHost) return true;
      return localStorage.getItem('clbhouz_preview_bypass') === '1';
    } catch { return false; }
  })();
  const isBetaGateRoute = location.pathname === '/' && !isMedianApp() && !isPreviewBypass;
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname) ||
    HIDDEN_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix)) ||
    isOnboardingEditProfile ||
    isBetaGateRoute;

  const isClubhouseRoute = CLUBHOUSE_ROUTES.includes(location.pathname);
  const isWarmGradientRoute = WARM_GRADIENT_ROUTES.some(r => location.pathname.startsWith(r));
  const isTourHubRoute = location.pathname.startsWith('/tourhub');
  const isHandicapRoute = location.pathname.startsWith('/handicap');
  /** Charcoal nav chrome on the Clubhouse page only; light everywhere else. */
  const isDarkChromeRoute = isClubhouseRoute;
  
  const showNavigation = isVisible && !shouldHideForRoute;

  // Scroll-direction hide/show — only on the feed (Clubhouse).
  // Down past ~80px hides the nav; up shows it; near top always shows.
  const [navHidden, setNavHidden] = useState(false);
  useEffect(() => {
    if (!isClubhouseRoute) { setNavHidden(false); return; }
    const lastTopByEl = new WeakMap<EventTarget, number>();
    let raf = 0;
    const onScroll = (e: Event) => {
      const target = e.target as (HTMLElement | Document | null);
      if (!target) return;
      const top = target === document
        ? window.scrollY
        : (target as HTMLElement).scrollTop ?? 0;
      const key: EventTarget = target === document ? window : target;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const prev = lastTopByEl.get(key) ?? 0;
        const delta = top - prev;
        lastTopByEl.set(key, top);
        if (top < 80) { setNavHidden(false); return; }
        if (delta > 8) setNavHidden(true);
        else if (delta < -4) setNavHidden(false);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true } as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isClubhouseRoute]);

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
    } else if (
      tab.id === 'clubhouse' &&
      (location.pathname === '/' || location.pathname === '/clubhouse')
    ) {
      // Already on Clubhouse — CardFeed listens for this event and scrolls Virtuoso to top.
      window.dispatchEvent(new CustomEvent('clbhouz-active-tab-retap', { detail: { tabId: 'clubhouse' } }));
    } else if (tab.path && location.pathname === tab.path) {
      // Already on this tab's route — return to top.
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="global-bottom-nav-shell">
            <motion.div
              className="global-bottom-nav"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: navHidden ? '100%' : 0, opacity: navHidden ? 0 : 1 }}
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
                  // Charcoal nav chrome on Clubhouse; matches feed surface (#15171F).
                  background: isDarkChromeRoute ? '#15171F' : '#F8FAFC',
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
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalBottomNavigation;
