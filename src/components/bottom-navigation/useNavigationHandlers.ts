import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationTabs } from './navigationTabs';
import { useHub } from '@/features/hub/useHub';
import { prefetchHeroVideo } from '@/utils/heroVideoPrefetch';
import { prefetchClubhouseVideos } from '@/utils/clubhouseVideoPrefetch';
import { prefetchProfileVideos, resolveUsernameToId } from '@/utils/profileVideoPrefetch';
import { useActiveActor } from '@/context/ActiveActorContext';

export const useNavigationHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open: openHub } = useHub();
  const { activeActor } = useActiveActor();
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
      
      // Trigger prefetch on click too (not just hover) for reliability
      if (tab.path.includes('shorts') || tab.path.includes('discover')) {
        console.log('[Navigation] Click-triggered hero prefetch');
        prefetchHeroVideo();
      }

      // If navigating to Hub, use Hub context to capture origin
      if (tab.path === '/hub' || tab.path.startsWith('/hub')) {
        openHub();
      } else if (tab.path === '/profile') {
        // Profile tab: navigate to business profile when acting as business
        if (activeActor?.type === 'business' && activeActor?.slug) {
          navigate(`/business/${activeActor.slug}`);
        } else {
          navigate(tab.path);
        }
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }, 50);
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
   * Prefetches videos when user hovers over Watch/Discover, Clubhouse/Home, or Profile tabs.
   */
  const handlePrefetch = useCallback((path: string) => {
    console.log('[useNavigationHandlers] handlePrefetch called with:', path);

    // Prefetch hero video for Watch/Discover shorts tab
    if (path.includes('shorts') || path.includes('discover')) {
      console.log('[Navigation] Triggering hero prefetch for path:', path);
      prefetchHeroVideo().then(id => {
        if (id) {
          console.log('[Navigation] Hero prefetch completed:', id.slice(0, 8));
        }
      });
    }
    
    // Prefetch for Clubhouse/Home tab
    if (path === '/clubhouse' || path === '/' || path.includes('clubhouse')) {
      console.log('[Navigation] Triggering clubhouse prefetch for path:', path);
      prefetchClubhouseVideos().then(ids => {
        if (ids && ids.length > 0) {
          console.log('[Navigation] Clubhouse prefetch completed:', ids.length, 'videos');
        }
      });
    }
    
    // Prefetch for Profile page
    if (path.includes('/profile') || path.includes('/u/')) {
      console.log('[Navigation] Triggering profile prefetch for path:', path);
      
      // Extract userId or username from path
      const userIdMatch = path.match(/\/profile\/([^\/]+)/);
      const usernameMatch = path.match(/\/u\/([^\/]+)/);
      
      if (usernameMatch?.[1]) {
        // Path has username - need to resolve to ID first
        resolveUsernameToId(usernameMatch[1]).then(userId => {
          if (userId) {
            prefetchProfileVideos(userId).then(ids => {
              if (ids && ids.length > 0) {
                console.log('[Navigation] Profile prefetch completed:', ids.length, 'videos');
              }
            });
          }
        });
      } else if (userIdMatch?.[1]) {
        // Path has userId directly
        prefetchProfileVideos(userIdMatch[1]).then(ids => {
          if (ids && ids.length > 0) {
            console.log('[Navigation] Profile prefetch completed:', ids.length, 'videos');
          }
        });
      } else {
        // Own profile (no specific user in path)
        prefetchProfileVideos().then(ids => {
          if (ids && ids.length > 0) {
            console.log('[Navigation] Own profile prefetch completed:', ids.length, 'videos');
          }
        });
      }
    }
  }, []);

  return {
    activeTab,
    handleTabClick,
    handlePrefetch
  };
};
