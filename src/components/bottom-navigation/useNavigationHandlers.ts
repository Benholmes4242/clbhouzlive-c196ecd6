
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationTabs } from './navigationTabs';
import { useHub } from '@/features/hub/useHub';
import { prefetchHeroVideo } from '@/utils/heroVideoPrefetch';

export const useNavigationHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open: openHub } = useHub();
  const [activeTab, setActiveTab] = useState('clubhouse');

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/' || location.pathname === '/clubhouse') {
      setActiveTab('clubhouse');
    } else if (location.pathname.startsWith('/hub')) {
      // Keep hub icon active for all /hub/* routes
      setActiveTab('hub');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    console.log('useNavigationHandlers: handleTabClick called with:', tab);
    
    if (tab.isAction) {
      console.log('useNavigationHandlers: Action tab detected, not handling navigation');
      // Action tabs are handled by the parent component (BottomNavigation)
      return;
    }

    if (tab.path) {
      console.log('useNavigationHandlers: Navigating to:', tab.path);
      setActiveTab(tab.id);

      // If navigating to Hub, use Hub context to capture origin
      if (tab.path === '/hub' || tab.path.startsWith('/hub')) {
        openHub();
      } else {
        navigate(tab.path);
        // Only scroll to top when navigating to different pages, not when staying on profile or hub
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }, 50);
      }
    }
  };

  /**
   * Handle prefetch triggers from tab hover/touch.
   * Prefetches hero video when user hovers over Watch/Discover tab.
   */
  const handlePrefetch = useCallback((path: string) => {
    // Prefetch hero video for Watch/Discover shorts tab
    if (path.includes('shorts') || path.includes('discover')) {
      prefetchHeroVideo();
    }
  }, []);

  return {
    activeTab,
    handleTabClick,
    handlePrefetch
  };
};
